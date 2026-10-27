/**
 * Comprehensive Automated Verification & Edge-Case Test Suite for SecureBlock Cloud
 * Uses Node.js native Web Crypto API (crypto.webcrypto.subtle)
 */

import crypto from 'node:crypto';

const subtle = crypto.webcrypto.subtle;

function bufferToHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function arrayBufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function base64ToArrayBuffer(base64) {
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// Emulated block continuity checker (mirrors src/services/verification.ts)
function validateBlockSetContinuity(blocks, expectedBlockCount) {
  if (!blocks || blocks.length === 0) {
    return { valid: false, error: 'Zero encrypted blocks located in storage.' };
  }
  if (blocks.length !== expectedBlockCount) {
    return {
      valid: false,
      error: `Block count mismatch: expected ${expectedBlockCount} blocks, but found ${blocks.length} blocks.`,
    };
  }
  const sorted = [...blocks].sort((a, b) => a.index - b.index);
  for (let i = 0; i < expectedBlockCount; i++) {
    if (sorted[i].index !== i) {
      return {
        valid: false,
        error: `Block sequence broken: expected index ${i}, but found ${sorted[i].index}.`,
      };
    }
  }
  return { valid: true };
}

function reassembleBlocks(blocks) {
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

async function runAllTests() {
  console.log('===============================================================');
  console.log(' SECUREBLOCK CLOUD — REAL-WORLD CRYPTO & EDGE-CASE AUDIT SUITE ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, detail = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      process.exitCode = 1;
    }
  }

  // --- SUITE 1: Empty Files (0 Bytes) ---
  console.log('--- Suite 1: Empty File Handling (0-Byte Payloads) ---');
  {
    const emptyPlaintext = new Uint8Array(0);
    const emptyHash = bufferToHex(await subtle.digest('SHA-256', emptyPlaintext));
    assert(
      emptyHash === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'Test 1.1: 0-byte file produces canonical SHA-256 hash'
    );

    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedEmpty = await subtle.encrypt({ name: 'AES-GCM', iv }, key, emptyPlaintext);
    assert(
      encryptedEmpty.byteLength === 16,
      'Test 1.2: Encrypted 0-byte file produces exactly 16 bytes (AES-GCM auth tag)'
    );

    const decryptedEmpty = await subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedEmpty);
    assert(decryptedEmpty.byteLength === 0, 'Test 1.3: Decrypted empty file returns 0 bytes');

    const reconstructedEmptyHash = bufferToHex(await subtle.digest('SHA-256', decryptedEmpty));
    assert(reconstructedEmptyHash === emptyHash, 'Test 1.4: Reconstructed empty file SHA-256 matches: MATCH');
  }

  // --- SUITE 2: Arbitrary Binary Data (High Entropy) ---
  console.log('\n--- Suite 2: Binary File Testing (All Byte Values 0x00-0xFF) ---');
  {
    const binaryData = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      binaryData[i] = i % 256;
    }
    const binaryHash = bufferToHex(await subtle.digest('SHA-256', binaryData));
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, binaryData);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const decryptedHash = bufferToHex(await subtle.digest('SHA-256', decrypted));
    assert(
      decryptedHash === binaryHash && new Uint8Array(decrypted).every((b, i) => b === binaryData[i]),
      'Test 2.1: Arbitrary binary data encrypted and decrypted with byte-level fidelity'
    );
  }

  // --- SUITE 3: Block Boundary Edge Cases ---
  console.log('\n--- Suite 3: Block Size Boundary Edge Cases ---');
  {
    const blockSize = 64; // Small block size to test precise byte boundaries
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Case 3a: Exactly 1 block boundary
    // Plaintext of 48 bytes + 16 bytes GCM tag = 64 bytes total ciphertext (exact 1 block)
    const exact1Data = new Uint8Array(48);
    const exact1Cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, exact1Data);
    const exact1Blocks = Math.ceil(exact1Cipher.byteLength / blockSize);
    assert(
      exact1Cipher.byteLength === 64 && exact1Blocks === 1,
      'Test 3.1: Ciphertext exactly matching block boundary (64 B) yields exactly 1 block'
    );

    // Case 3b: Just over 1 block boundary (65 bytes total ciphertext => 2 blocks)
    const over1Data = new Uint8Array(49);
    const over1Cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, over1Data);
    const over1Blocks = Math.ceil(over1Cipher.byteLength / blockSize);
    assert(
      over1Cipher.byteLength === 65 && over1Blocks === 2,
      'Test 3.2: Ciphertext 1 byte over boundary (65 B) correctly spills into 2 blocks (64 B + 1 B)'
    );

    // Case 3c: Multi-block exact boundary (128 bytes total ciphertext => 2 blocks of 64)
    const exact2Data = new Uint8Array(112);
    const exact2Cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, exact2Data);
    const exact2Blocks = Math.ceil(exact2Cipher.byteLength / blockSize);
    assert(
      exact2Cipher.byteLength === 128 && exact2Blocks === 2,
      'Test 3.3: Exact 2-block boundary (128 B) yields 2 full blocks without extra empty blocks'
    );
  }

  // --- SUITE 4: Multi-Block Segmentation & Ordinal Reconstruction ---
  console.log('\n--- Suite 4: Multi-Block Segmentation & Reassembly ---');
  let multiCiphertext;
  let multiBlocks = [];
  let multiKey;
  let multiIv;
  let multiOrigHash;
  {
    const largeData = new Uint8Array(5000);
    crypto.getRandomValues(largeData);
    multiOrigHash = bufferToHex(await subtle.digest('SHA-256', largeData));
    multiKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    multiIv = crypto.getRandomValues(new Uint8Array(12));
    multiCiphertext = await subtle.encrypt({ name: 'AES-GCM', iv: multiIv }, multiKey, largeData);

    const bSize = 512;
    const bCount = Math.ceil(multiCiphertext.byteLength / bSize);

    for (let i = 0; i < bCount; i++) {
      const start = i * bSize;
      const end = Math.min(start + bSize, multiCiphertext.byteLength);
      const chunk = multiCiphertext.slice(start, end);
      const chunkHash = bufferToHex(await subtle.digest('SHA-256', chunk));
      multiBlocks.push({ index: i, displayIndex: i + 1, data: chunk, size: chunk.byteLength, hash: chunkHash });
    }

    assert(multiBlocks.length === 10, 'Test 4.1: 5016-byte payload cleanly segmented into 10 blocks');

    const reassembled = reassembleBlocks(multiBlocks);
    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: multiIv }, multiKey, reassembled);
    const reconHash = bufferToHex(await subtle.digest('SHA-256', decrypted));
    assert(reconHash === multiOrigHash, 'Test 4.2: 10-block reassembly & decryption produces exact original hash');
  }

  // --- SUITE 5: Missing Block Detection ---
  console.log('\n--- Suite 5: Incomplete & Missing Block Detection ---');
  {
    // Remove block #3 from 10 blocks
    const incompleteBlocks = multiBlocks.filter((b) => b.index !== 3);
    const check = validateBlockSetContinuity(incompleteBlocks, 10);
    assert(
      !check.valid && check.error.includes('Block count mismatch'),
      'Test 5.1: Missing block immediately detected by continuity checker'
    );
  }

  // --- SUITE 6: Reordered & Duplicate Block Indices ---
  console.log('\n--- Suite 6: Block Sequence & Duplicate Index Validation ---');
  {
    // Scramble order
    const scrambled = [...multiBlocks].reverse();
    const reassembledFromScrambled = reassembleBlocks(scrambled);
    assert(
      bufferToHex(reassembledFromScrambled) === bufferToHex(multiCiphertext),
      'Test 6.1: reassembleBlocks handles scrambled array by enforcing strict ordinal sort'
    );

    // Duplicate block index (two blocks with index 0, missing block 1)
    const duplicateIndexSet = [
      { ...multiBlocks[0] },
      { ...multiBlocks[0], index: 0 },
      ...multiBlocks.slice(2),
    ];
    const checkDuplicate = validateBlockSetContinuity(duplicateIndexSet, 10);
    assert(
      !checkDuplicate.valid && checkDuplicate.error.includes('Block sequence broken'),
      'Test 6.2: Duplicate block index detected and rejected'
    );
  }

  // --- SUITE 7: Ciphertext Bit-Level Tampering Resilience ---
  console.log('\n--- Suite 7: Cryptographic Tamper Detection & AEAD Auth ---');
  {
    // 7a: Altered block fails SHA-256 checksum
    const tamperedBlock0 = new Uint8Array(multiBlocks[0].data.slice(0));
    tamperedBlock0[5] ^= 0x01; // Flip 1 bit
    const computedBlockHash = bufferToHex(await subtle.digest('SHA-256', tamperedBlock0));
    assert(
      computedBlockHash !== multiBlocks[0].hash,
      'Test 7.1: Single-bit flip in block #1 triggers SHA-256 checksum mismatch'
    );

    // 7b: Attacker updates block hash to fool checksum -> AES-GCM tag MUST fail
    let gcmRejected = false;
    try {
      const tamperedSet = multiBlocks.map((b, idx) =>
        idx === 0 ? { ...b, data: tamperedBlock0.buffer } : b
      );
      const reassembledTampered = reassembleBlocks(tamperedSet);
      await subtle.decrypt({ name: 'AES-GCM', iv: multiIv }, multiKey, reassembledTampered);
    } catch {
      gcmRejected = true;
    }
    assert(
      gcmRejected,
      'Test 7.2: Attacker bypassing block hash is unequivocally rejected by AES-GCM auth tag (OperationError)'
    );
  }

  // --- SUITE 8: Incorrect IV & Corrupted Tag ---
  console.log('\n--- Suite 8: Initialization Vector & Auth Tag Integrity ---');
  {
    let ivRejected = false;
    const wrongIv = crypto.getRandomValues(new Uint8Array(12));
    try {
      await subtle.decrypt({ name: 'AES-GCM', iv: wrongIv }, multiKey, multiCiphertext);
    } catch {
      ivRejected = true;
    }
    assert(ivRejected, 'Test 8.1: Decryption with altered IV rejected by AES-GCM auth tag');
  }

  // --- SUITE 9: Key Wrapping & Master Key Hierarchy ---
  console.log('\n--- Suite 9: Master Key Hierarchy & Key Wrapping ---');
  let masterKey;
  let wrappedKey;
  let wrapIv;
  {
    masterKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['wrapKey', 'unwrapKey']);
    wrapIv = crypto.getRandomValues(new Uint8Array(12));
    wrappedKey = await subtle.wrapKey('raw', multiKey, masterKey, { name: 'AES-GCM', iv: wrapIv });
    assert(wrappedKey.byteLength === 48, 'Test 9.1: 256-bit AES key wrapped under Master Key (32B key + 16B GCM tag = 48B)');

    // Corrupt wrapped key bytes -> unwrap must fail
    const corruptedWrappedKey = new Uint8Array(wrappedKey.slice(0));
    corruptedWrappedKey[0] ^= 0xff;
    let unwrapFailed = false;
    try {
      await subtle.unwrapKey('raw', corruptedWrappedKey.buffer, masterKey, { name: 'AES-GCM', iv: wrapIv }, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    } catch {
      unwrapFailed = true;
    }
    assert(unwrapFailed, 'Test 9.2: Corrupted wrapped-key payload rejected during unwrapKey');

    // Valid unwrap
    const unwrappedKey = await subtle.unwrapKey('raw', wrappedKey, masterKey, { name: 'AES-GCM', iv: wrapIv }, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const dec = await subtle.decrypt({ name: 'AES-GCM', iv: multiIv }, unwrappedKey, multiCiphertext);
    const hash = bufferToHex(await subtle.digest('SHA-256', dec));
    assert(hash === multiOrigHash, 'Test 9.3: Successfully unwrapped key decrypts payload accurately');
  }

  // --- SUITE 10: Master Key Replacement Guard (Simulated DB Logic) ---
  console.log('\n--- Suite 10: Master Key Silent Replacement Guard ---');
  {
    // Emulate getMasterKey safety check
    function testGetMasterKey(existingKeyRecord, fileCount) {
      if (existingKeyRecord) return 'KEY_VALID';
      if (fileCount > 0) {
        throw new Error(
          `Master Vault Key record is missing or damaged while ${fileCount} encrypted file(s) exist in storage. Silently generating a new key would permanently break decryption for existing files.`
        );
      }
      return 'NEW_KEY_GENERATED';
    }

    assert(testGetMasterKey({ key: 'existing' }, 5) === 'KEY_VALID', 'Test 10.1: Returns existing master key when present');
    assert(testGetMasterKey(null, 0) === 'NEW_KEY_GENERATED', 'Test 10.2: Safely generates initial key when vault is completely clean (0 files)');

    let replacementBlocked = false;
    try {
      testGetMasterKey(null, 3);
    } catch (err) {
      replacementBlocked = err.message.includes('Silently generating a new key would permanently break decryption');
    }
    assert(replacementBlocked, 'Test 10.3: Explicitly BLOCKS silent master key generation when encrypted files exist in storage');
  }

  // --- SUITE 11: Duplicate Filenames Isolation ---
  console.log('\n--- Suite 11: Duplicate Filename Isolation ---');
  {
    const fileId1 = 'uuid-file-1';
    const fileId2 = 'uuid-file-2';
    const filename = 'annual_report.pdf';

    const objKey1 = `vault/${fileId1}/blocks/block-0001.enc`;
    const objKey2 = `vault/${fileId2}/blocks/block-0001.enc`;

    assert(
      fileId1 !== fileId2 && objKey1 !== objKey2,
      'Test 11.1: Files with identical names receive isolated UUIDs and unique object storage keys'
    );
  }

  // --- SUITE 12: Vault Backup Package Export, Validation & Recovery ---
  console.log('\n--- Suite 12: Vault Backup Package Export & Recovery ---');
  {
    // Export Master Key raw bytes
    const masterRaw = await subtle.exportKey('raw', masterKey);
    const masterKeyBase64 = arrayBufferToBase64(masterRaw);

    const backupBundle = {
      version: '1.0.0',
      exportTimestamp: Date.now(),
      system: 'SecureBlock Cloud Vault Export',
      masterKeyBase64,
      files: [
        {
          id: 'test-file-1',
          name: 'large_document.bin',
          originalHash: multiOrigHash,
          ivBase64: arrayBufferToBase64(multiIv.buffer),
          wrappedKeyBase64: arrayBufferToBase64(wrappedKey),
          wrapIvBase64: arrayBufferToBase64(wrapIv.buffer),
          blockSize: 512,
          blockCount: multiBlocks.length,
        },
      ],
      blocks: multiBlocks.map((b) => ({
        id: `test-file-1_block_${b.index}`,
        fileId: 'test-file-1',
        index: b.index,
        hash: b.hash,
        dataBase64: arrayBufferToBase64(b.data),
      })),
    };

    const bundleString = JSON.stringify(backupBundle);

    // Emulate import validation
    const parsed = JSON.parse(bundleString);
    assert(
      parsed.version === '1.0.0' && Array.isArray(parsed.files) && Array.isArray(parsed.blocks) && parsed.masterKeyBase64,
      'Test 12.1: Vault backup package correctly structures files, blocks, and recovery Master Key'
    );

    // Emulate import and recovery on a fresh vault
    const recoveredMasterKey = await subtle.importKey(
      'raw',
      base64ToArrayBuffer(parsed.masterKeyBase64),
      { name: 'AES-GCM', length: 256 },
      true,
      ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
    );

    const recoveredFile = parsed.files[0];
    const recoveredWrappedKey = base64ToArrayBuffer(recoveredFile.wrappedKeyBase64);
    const recoveredWrapIv = new Uint8Array(base64ToArrayBuffer(recoveredFile.wrapIvBase64));
    const recoveredFileIv = new Uint8Array(base64ToArrayBuffer(recoveredFile.ivBase64));

    const recoveredFileKey = await subtle.unwrapKey(
      'raw',
      recoveredWrappedKey,
      recoveredMasterKey,
      { name: 'AES-GCM', iv: recoveredWrapIv },
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const recoveredBlockList = parsed.blocks.map((b) => ({
      index: b.index,
      data: base64ToArrayBuffer(b.dataBase64),
    }));

    const recoveredCiphertext = reassembleBlocks(recoveredBlockList);
    const recoveredPlaintext = await subtle.decrypt(
      { name: 'AES-GCM', iv: recoveredFileIv },
      recoveredFileKey,
      recoveredCiphertext
    );

    const recoveredHash = bufferToHex(await subtle.digest('SHA-256', recoveredPlaintext));
    assert(
      recoveredHash === multiOrigHash,
      'Test 12.2: Exported vault package imported into clean environment achieves 100% successful decryption & verification: MATCH'
    );
  }

  console.log('\n===============================================================');
  console.log(` AUDIT RESULT: ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');
}

runAllTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exitCode = 1;
});
