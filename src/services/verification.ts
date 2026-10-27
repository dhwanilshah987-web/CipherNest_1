import type { FileRecord, VerificationResult } from '../types';
import {
  calculateSha256,
  reassembleBlocks,
  unwrapFileKey,
  decryptAesGcm,
  arrayBufferToBase64,
} from './crypto';
import {
  getBlocksByFileId,
  getMasterKey,
  logActivity,
  updateFileRecord,
} from './db';

/**
 * Validates the completeness and continuity of a block set before reassembly.
 * Ensures:
 * 1. blocks.length === expectedBlockCount
 * 2. Every block index from 0 to expectedBlockCount - 1 is present exactly once
 */
export function validateBlockSetContinuity(
  blocks: { index: number; displayIndex: number; id: string }[],
  expectedBlockCount: number
): { valid: boolean; error?: string } {
  if (!blocks || blocks.length === 0) {
    return { valid: false, error: 'Zero encrypted blocks located in storage.' };
  }

  if (blocks.length !== expectedBlockCount) {
    return {
      valid: false,
      error: `Block count mismatch: expected ${expectedBlockCount} blocks, but found ${blocks.length} blocks in storage. (A block may have been deleted or corrupted).`,
    };
  }

  const sorted = [...blocks].sort((a, b) => a.index - b.index);
  for (let i = 0; i < expectedBlockCount; i++) {
    if (sorted[i].index !== i) {
      return {
        valid: false,
        error: `Block sequence broken: expected block index ${i}, but found index ${sorted[i].index}. Blocks may be missing or duplicated.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Reassembles raw encrypted ciphertext blocks into a single downloadable .enc file.
 * Verifies the block count, ordering continuity, and individual block checksums before reassembling.
 */
export async function prepareEncryptedPayloadDownload(file: FileRecord): Promise<{
  blob: Blob;
  filename: string;
  totalBlocks: number;
  encryptedSize: number;
}> {
  const blocks = await getBlocksByFileId(file.id);

  // Validate block completeness and continuous indexing
  const continuity = validateBlockSetContinuity(blocks, file.blockCount);
  if (!continuity.valid) {
    throw new Error(continuity.error);
  }

  // Verify all block hashes
  for (const block of blocks) {
    const computedHash = await calculateSha256(block.data);
    if (computedHash !== block.hash) {
      throw new Error(
        `Block #${block.displayIndex} failed checksum verification. Stored: ${block.hash.slice(0, 8)}..., computed: ${computedHash.slice(0, 8)}...`
      );
    }
  }

  const fullCiphertext = reassembleBlocks(blocks);
  const blob = new Blob([fullCiphertext], { type: 'application/octet-stream' });
  const filename = `${file.name}.enc`;

  await logActivity({
    type: 'ENCRYPTED_DOWNLOAD',
    operation: 'GetObject',
    storageMode: 'Demo Environment',
    fileId: file.id,
    fileName: file.name,
    outcome: 'SUCCESS',
    details: `GetObject: Assembled ${blocks.length} ciphertext blocks into raw encrypted binary payload (${(fullCiphertext.byteLength / 1024).toFixed(1)} KiB) for download.`,
  });

  return {
    blob,
    filename,
    totalBlocks: blocks.length,
    encryptedSize: fullCiphertext.byteLength,
  };
}

/**
 * Packages the file's ciphertext blocks along with its IV, wrapping metadata,
 * and block checksums into a standalone encrypted recovery container (.sbpackage.json).
 * Does NOT expose raw plaintext encryption keys.
 */
export async function prepareEncryptedPackageDownload(file: FileRecord): Promise<{
  blob: Blob;
  filename: string;
}> {
  const blocks = await getBlocksByFileId(file.id);

  const continuity = validateBlockSetContinuity(blocks, file.blockCount);
  if (!continuity.valid) {
    throw new Error(continuity.error);
  }

  const packageData = {
    format: 'SecureBlock-Encrypted-Package-v1',
    packageTimestamp: Date.now(),
    file: {
      id: file.id,
      name: file.name,
      extension: file.extension,
      mimeType: file.mimeType,
      originalSize: file.originalSize,
      originalHash: file.originalHash,
      algorithm: file.algorithm,
      ivBase64: arrayBufferToBase64(file.iv.buffer as ArrayBuffer),
      wrappedKeyBase64: arrayBufferToBase64(file.wrappedKey),
      wrapIvBase64: arrayBufferToBase64(file.wrapIv.buffer as ArrayBuffer),
      blockSize: file.blockSize,
      blockSizeLabel: file.blockSizeLabel,
      encryptedSize: file.encryptedSize,
      blockCount: file.blockCount,
      createdAt: file.createdAt,
    },
    blocks: blocks.map((b) => ({
      index: b.index,
      displayIndex: b.displayIndex,
      size: b.size,
      hash: b.hash,
      objectKey: b.objectKey,
      dataBase64: arrayBufferToBase64(b.data),
    })),
  };

  const jsonString = JSON.stringify(packageData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `${file.name}.sbpackage.json`;

  return { blob, filename };
}

/**
 * Reconstructs the original plaintext file from its encrypted blocks:
 * 1. Retrieves all stored blocks for the file.
 * 2. Verifies block completeness and ordinal sequence (0..N-1).
 * 3. Verifies individual block SHA-256 hashes against stored checksums.
 * 4. Reassembles the blocks in strict ordinal sequence.
 * 5. Unwraps the file encryption key using the Master Vault Key.
 * 6. Decrypts the reassembled ciphertext with AES-256-GCM (authenticating the 128-bit tag).
 * 7. Calculates the reconstructed plaintext's SHA-256 hash.
 * 8. Compares the reconstructed hash against the original recorded hash.
 * 9. Records persistent activity and updates file verification state.
 */
export async function reconstructAndVerifyFile(
  file: FileRecord
): Promise<{
  result: VerificationResult;
  decryptedBlob?: Blob;
}> {
  const startTime = performance.now();
  const blocks = await getBlocksByFileId(file.id);

  // 1. Verify block completeness and ordinal continuity
  const continuity = validateBlockSetContinuity(blocks, file.blockCount);
  if (!continuity.valid) {
    const result: VerificationResult = {
      fileId: file.id,
      fileName: file.name,
      originalHash: file.originalHash,
      reconstructedHash: '',
      match: false,
      blockCount: file.blockCount,
      validBlocks: blocks?.length || 0,
      decryptionStatus: 'FAILED',
      errorMessage: continuity.error,
      durationMs: Math.round(performance.now() - startTime),
      timestamp: Date.now(),
    };
    await recordFailure(file, result, continuity.error || 'Block set incomplete.');
    return { result };
  }

  // 2. Verify individual block checksums
  let validBlocks = 0;
  for (const block of blocks) {
    const computedHash = await calculateSha256(block.data);
    if (computedHash === block.hash) {
      validBlocks++;
    } else {
      const result: VerificationResult = {
        fileId: file.id,
        fileName: file.name,
        originalHash: file.originalHash,
        reconstructedHash: '',
        match: false,
        blockCount: blocks.length,
        validBlocks,
        decryptionStatus: 'FAILED',
        errorMessage: `Integrity failure in Block #${block.displayIndex} (${block.objectKey}): Ciphertext has been modified or corrupted in browser storage.`,
        durationMs: Math.round(performance.now() - startTime),
        timestamp: Date.now(),
      };

      await recordFailure(file, result, `Block #${block.displayIndex} checksum mismatch.`);
      return { result };
    }
  }

  // 3. Reassemble ciphertext strictly by index
  const reassembledCiphertext = reassembleBlocks(blocks);

  // 4. Key unwrapping and AES-256-GCM Decryption
  let decryptedBytes: ArrayBuffer;
  try {
    const masterKey = await getMasterKey();
    const fileKey = await unwrapFileKey(file.wrappedKey, masterKey, file.wrapIv);
    decryptedBytes = await decryptAesGcm(reassembledCiphertext, fileKey, file.iv);
  } catch (err: any) {
    const result: VerificationResult = {
      fileId: file.id,
      fileName: file.name,
      originalHash: file.originalHash,
      reconstructedHash: '',
      match: false,
      blockCount: blocks.length,
      validBlocks,
      decryptionStatus: 'FAILED',
      errorMessage: `AES-GCM Decryption / Authentication Tag failure: ${err?.message || 'Ciphertext, IV, or key was modified.'}`,
      durationMs: Math.round(performance.now() - startTime),
      timestamp: Date.now(),
    };

    await recordFailure(
      file,
      result,
      'AES-GCM authentication tag rejected ciphertext as tampered.'
    );
    return { result };
  }

  // 5. Calculate reconstructed plaintext SHA-256
  const reconstructedHash = await calculateSha256(decryptedBytes);
  const match = reconstructedHash.toLowerCase() === file.originalHash.toLowerCase();
  const durationMs = Math.round(performance.now() - startTime);

  const verificationResult: VerificationResult = {
    fileId: file.id,
    fileName: file.name,
    originalHash: file.originalHash,
    reconstructedHash,
    match,
    blockCount: blocks.length,
    validBlocks,
    decryptionStatus: 'SUCCESS',
    durationMs,
    timestamp: Date.now(),
  };

  if (match) {
    // Update file record
    await updateFileRecord({
      ...file,
      lastVerifiedAt: Date.now(),
      lastVerifyStatus: 'MATCH',
    });

    await logActivity({
      type: 'RECONSTRUCTION_PASSED',
      operation: 'VerifyIntegrity',
      storageMode: 'Demo Environment',
      fileId: file.id,
      fileName: file.name,
      outcome: 'SUCCESS',
      details: `VerifyIntegrity: PASSED for ${file.name}. All ${blocks.length} blocks valid. Original SHA-256 matched reconstructed hash in ${durationMs}ms.`,
    });

    const decryptedBlob = new Blob([decryptedBytes], {
      type: file.mimeType || 'application/octet-stream',
    });

    return {
      result: verificationResult,
      decryptedBlob,
    };
  } else {
    await recordFailure(
      file,
      verificationResult,
      `Calculated hash (${reconstructedHash.slice(0, 10)}...) does not match original recorded hash.`
    );
    return { result: verificationResult };
  }
}

async function recordFailure(
  file: FileRecord,
  result: VerificationResult,
  reason: string
) {
  await updateFileRecord({
    ...file,
    lastVerifiedAt: Date.now(),
    lastVerifyStatus: 'MISMATCH',
  });

  await logActivity({
    type: 'RECONSTRUCTION_FAILED',
    operation: 'VerifyIntegrity',
    storageMode: 'Demo Environment',
    fileId: file.id,
    fileName: file.name,
    outcome: 'FAILURE',
    details: `VerifyIntegrity: FAILED for ${file.name}. ${reason} ${result.errorMessage || ''}`,
  });
}
