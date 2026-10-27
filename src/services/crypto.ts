/**
 * Cryptographic service utilizing the standard Web Crypto API.
 * Provides AES-256-GCM encryption/decryption, SHA-256 digest computation,
 * secure random IV generation, and Master Key wrapping hierarchy.
 */

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Calculates SHA-256 hash of provided binary data using crypto.subtle.digest.
 */
export async function calculateSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const digestBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return bufferToHex(digestBuffer);
}

/**
 * Generates a fresh cryptographically secure random Initialization Vector (IV).
 * Standard AES-GCM uses 96-bit (12 bytes) IVs for optimal performance and security.
 */
export function generateIv(length = 12): Uint8Array {
  const iv = new Uint8Array(length);
  crypto.getRandomValues(iv);
  return iv;
}

/**
 * Generates a cryptographically strong 256-bit AES-GCM symmetric key.
 */
export async function generateAesGcmKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Extractable so it can be wrapped under the Master Vault Key
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates the Master Vault Key used to wrap and unwrap per-file encryption keys.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Permitted for wrapping and unwrapping, and backup export
    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary binary data using AES-256-GCM.
 * The resulting ArrayBuffer contains ciphertext followed by the 128-bit authentication tag.
 */
export async function encryptAesGcm(
  data: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );
}

/**
 * Decrypts AES-256-GCM ciphertext.
 * Throws an OperationError if the ciphertext or authentication tag is tampered or corrupted.
 */
export async function decryptAesGcm(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    ciphertext
  );
}

/**
 * Wraps a per-file AES key under the Master Vault Key using AES-GCM.
 */
export async function wrapFileKey(
  fileKey: CryptoKey,
  masterKey: CryptoKey,
  wrapIv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.wrapKey(
    'raw',
    fileKey,
    masterKey,
    {
      name: 'AES-GCM',
      iv: wrapIv as BufferSource,
    }
  );
}

/**
 * Unwraps a wrapped AES file key using the Master Vault Key.
 */
export async function unwrapFileKey(
  wrappedKey: ArrayBuffer,
  masterKey: CryptoKey,
  wrapIv: Uint8Array
): Promise<CryptoKey> {
  return await crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    masterKey,
    {
      name: 'AES-GCM',
      iv: wrapIv as BufferSource,
    },
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Non-extractable unwrapped key for defense in depth
    ['decrypt']
  );
}

/**
 * Splits an encrypted ArrayBuffer into distinct blocks of specified size.
 * Computes individual SHA-256 hashes for each segment.
 */
export async function segmentCiphertextIntoBlocks(
  encryptedData: ArrayBuffer,
  fileId: string,
  blockSize: number
): Promise<{
  blocks: {
    id: string;
    fileId: string;
    index: number;
    displayIndex: number;
    data: ArrayBuffer;
    size: number;
    hash: string;
    objectKey: string;
    createdAt: number;
  }[];
  totalEncryptedSize: number;
  blockCount: number;
}> {
  const totalEncryptedSize = encryptedData.byteLength;
  const blockCount = Math.max(1, Math.ceil(totalEncryptedSize / blockSize));
  const blocks = [];
  const now = Date.now();

  for (let i = 0; i < blockCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, totalEncryptedSize);
    const chunkBuffer = encryptedData.slice(start, end);
    const chunkHash = await calculateSha256(chunkBuffer);
    const displayIndex = i + 1;
    const paddedIndex = String(displayIndex).padStart(4, '0');

    blocks.push({
      id: `${fileId}_block_${i}`,
      fileId,
      index: i,
      displayIndex,
      data: chunkBuffer,
      size: chunkBuffer.byteLength,
      hash: chunkHash,
      objectKey: `vault/${fileId}/blocks/block-${paddedIndex}.enc`,
      createdAt: now,
    });
  }

  return {
    blocks,
    totalEncryptedSize,
    blockCount,
  };
}

/**
 * Reassembles an array of ordered block ArrayBuffers into a single continuous ciphertext ArrayBuffer.
 */
export function reassembleBlocks(blocks: { data: ArrayBuffer; index: number }[]): ArrayBuffer {
  // Sort blocks strictly by index to ensure accurate reconstruction
  const sorted = [...blocks].sort((a, b) => a.index - b.index);
  const totalLength = sorted.reduce((sum, b) => sum + b.data.byteLength, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const block of sorted) {
    const blockBytes = new Uint8Array(block.data);
    combined.set(blockBytes, offset);
    offset += blockBytes.byteLength;
  }

  return combined.buffer;
}

/**
 * Formats a block ArrayBuffer into formatted hexadecimal lines for the hex inspector.
 */
export function formatHexViewer(
  buffer: ArrayBuffer,
  bytesPerLine = 16,
  maxBytes?: number
): {
  lines: { offset: string; hexParts: string[]; ascii: string }[];
  totalBytes: number;
  isTruncated: boolean;
} {
  const totalBytes = buffer.byteLength;
  const viewLength = maxBytes ? Math.min(totalBytes, maxBytes) : totalBytes;
  const bytes = new Uint8Array(buffer, 0, viewLength);
  const lines = [];

  for (let i = 0; i < viewLength; i += bytesPerLine) {
    const offset = i.toString(16).padStart(8, '0');
    const hexParts: string[] = [];
    let ascii = '';

    for (let j = 0; j < bytesPerLine; j++) {
      const idx = i + j;
      if (idx < viewLength) {
        const b = bytes[idx];
        hexParts.push(b.toString(16).padStart(2, '0'));
        // Printable ASCII range (32 to 126)
        ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
      } else {
        hexParts.push('  ');
        ascii += ' ';
      }
    }

    lines.push({ offset, hexParts, ascii });
  }

  return {
    lines,
    totalBytes,
    isTruncated: totalBytes > viewLength,
  };
}
