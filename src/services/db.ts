import type {
  FileRecord,
  BlockRecord,
  ActivityRecord,
  VaultSettings,
  StorageStats,
} from '../types';
import {
  generateMasterKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './crypto';

const DB_NAME = 'secureblock_cloud_vault_v1';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object Store: files
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('createdAt', 'createdAt', { unique: false });
        fileStore.createIndex('name', 'name', { unique: false });
      }

      // Object Store: blocks
      if (!db.objectStoreNames.contains('blocks')) {
        const blockStore = db.createObjectStore('blocks', { keyPath: 'id' });
        blockStore.createIndex('fileId', 'fileId', { unique: false });
        blockStore.createIndex('objectKey', 'objectKey', { unique: true });
        blockStore.createIndex('index', 'index', { unique: false });
      }

      // Object Store: activity
      if (!db.objectStoreNames.contains('activity')) {
        const activityStore = db.createObjectStore('activity', { keyPath: 'id' });
        activityStore.createIndex('timestamp', 'timestamp', { unique: false });
        activityStore.createIndex('type', 'type', { unique: false });
      }

      // Object Store: settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Object Store: keys
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
    };
  });
}

/**
 * Retrieves the Master Vault Key.
 *
 * CRITICAL AUDIT REQUIREMENT:
 * Never silently replace a missing master key with a brand new key if encrypted files
 * already exist in the database! Doing so would render all existing files permanently unrecoverable.
 */
export async function getMasterKey(): Promise<CryptoKey> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['keys', 'files'], 'readwrite');
    const keyStore = tx.objectStore('keys');
    const fileStore = tx.objectStore('files');
    const getKeyReq = keyStore.get('master_vault_key');
    const countFilesReq = fileStore.count();

    getKeyReq.onsuccess = () => {
      if (getKeyReq.result && getKeyReq.result.key) {
        resolve(getKeyReq.result.key as CryptoKey);
      } else {
        // Master key is missing from storage!
        countFilesReq.onsuccess = async () => {
          const fileCount = countFilesReq.result || 0;
          if (fileCount > 0) {
            reject(
              new Error(
                `Master Vault Key record is missing or damaged while ${fileCount} encrypted file(s) exist in storage. Silently generating a new key would permanently break decryption for existing files.`
              )
            );
            return;
          }

          // Clean vault with zero files: safe to generate initial master key
          try {
            const newMasterKey = await generateMasterKey();
            const putReq = keyStore.put({
              id: 'master_vault_key',
              key: newMasterKey,
              createdAt: Date.now(),
            });
            putReq.onsuccess = () => resolve(newMasterKey);
            putReq.onerror = () => reject(putReq.error);
          } catch (err) {
            reject(err);
          }
        };
        countFilesReq.onerror = () => reject(countFilesReq.error);
      }
    };

    getKeyReq.onerror = () => reject(getKeyReq.error);
  });
}

/**
 * Saves a file record and its encrypted blocks in an atomic IndexedDB transaction.
 * If any write operation fails, the transaction is automatically aborted to prevent orphaned records.
 */
export async function persistFileWithBlocks(
  file: FileRecord,
  blocks: BlockRecord[]
): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'blocks', 'activity'], 'readwrite');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error(`Transaction failed: ${tx.error?.message}`));
    tx.onabort = () => reject(new Error(`Transaction aborted: ${tx.error?.message}`));

    const fileStore = tx.objectStore('files');
    fileStore.put(file);

    const blockStore = tx.objectStore('blocks');
    for (const block of blocks) {
      blockStore.put(block);
    }

    const activityStore = tx.objectStore('activity');
    activityStore.put({
      id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random()}`,
      type: 'FILE_UPLOADED',
      operation: 'PutObject',
      storageMode: 'Demo Environment',
      bucket: 'secureblock-demo-bucket',
      region: 'us-east-1',
      timestamp: Date.now(),
      fileId: file.id,
      fileName: file.name,
      outcome: 'SUCCESS',
      details: `PutObject: Stored ${file.name} (${(file.originalSize / 1024).toFixed(1)} KiB) split across ${blocks.length} encrypted blocks (${file.blockSizeLabel}).`,
    } as ActivityRecord);
  });
}

/**
 * Fetches all file records ordered by creation date descending.
 */
export async function getAllFiles(): Promise<FileRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const req = store.getAll();

    req.onsuccess = () => {
      const records = (req.result as FileRecord[]) || [];
      records.sort((a, b) => b.createdAt - a.createdAt);
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetches a single file record by its ID.
 */
export async function getFileById(fileId: string): Promise<FileRecord | undefined> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const req = store.get(fileId);

    req.onsuccess = () => resolve(req.result as FileRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Updates an existing file record (e.g. verification status).
 */
export async function updateFileRecord(file: FileRecord): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const req = store.put(file);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all blocks belonging to a given file ID, ordered strictly by block index.
 */
export async function getBlocksByFileId(fileId: string): Promise<BlockRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blocks', 'readonly');
    const store = tx.objectStore('blocks');
    const index = store.index('fileId');
    const req = index.getAll(IDBKeyRange.only(fileId));

    req.onsuccess = () => {
      const blocks = (req.result as BlockRecord[]) || [];
      blocks.sort((a, b) => a.index - b.index);
      resolve(blocks);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a single block by ID.
 */
export async function getBlockById(blockId: string): Promise<BlockRecord | undefined> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blocks', 'readonly');
    const store = tx.objectStore('blocks');
    const req = store.get(blockId);

    req.onsuccess = () => resolve(req.result as BlockRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all blocks across the entire vault.
 */
export async function getAllBlocks(): Promise<BlockRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blocks', 'readonly');
    const store = tx.objectStore('blocks');
    const req = store.getAll();

    req.onsuccess = () => {
      const blocks = (req.result as BlockRecord[]) || [];
      blocks.sort((a, b) => b.createdAt - a.createdAt);
      resolve(blocks);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Simulates a cryptographic block tampering attack by modifying one byte of a block's ciphertext in IndexedDB.
 * Used for demonstrating real SHA-256 detection and AES-GCM authentication tag rejection.
 */
export async function tamperBlock(blockId: string): Promise<BlockRecord> {
  const db = await getDb();
  return new Promise(async (resolve, reject) => {
    const block = await getBlockById(blockId);
    if (!block) {
      return reject(new Error(`Block ${blockId} not found.`));
    }

    // Invert first byte
    const uint8 = new Uint8Array(block.data.slice(0));
    if (uint8.length > 0) {
      uint8[0] ^= 0xff;
    }

    const tamperedBlock: BlockRecord = {
      ...block,
      data: uint8.buffer as ArrayBuffer,
    };

    const tx = db.transaction(['blocks', 'activity'], 'readwrite');
    tx.oncomplete = () => resolve(tamperedBlock);
    tx.onerror = () => reject(tx.error);

    tx.objectStore('blocks').put(tamperedBlock);
    tx.objectStore('activity').put({
      id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random()}`,
      type: 'BLOCK_TAMPERED',
      operation: 'VerifyIntegrity',
      storageMode: 'Demo Environment',
      bucket: 'secureblock-demo-bucket',
      region: 'us-east-1',
      timestamp: Date.now(),
      fileId: block.fileId,
      outcome: 'WARNING',
      details: `[SIMULATION] Intentionally corrupted 1 byte in block #${block.displayIndex} (${block.objectKey}) to demonstrate SHA-256 / AES-GCM integrity rejection.`,
    } as ActivityRecord);
  });
}

/**
 * Deletes a file and all associated blocks and records an activity event atomically.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await getDb();
  const file = await getFileById(fileId);
  const blocks = await getBlocksByFileId(fileId);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'blocks', 'activity'], 'readwrite');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    // Delete file
    tx.objectStore('files').delete(fileId);

    // Delete all related blocks
    const blockStore = tx.objectStore('blocks');
    for (const b of blocks) {
      blockStore.delete(b.id);
    }

    // Record activity
    tx.objectStore('activity').put({
      id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random()}`,
      type: 'FILE_DELETED',
      operation: 'DeleteObject',
      storageMode: 'Demo Environment',
      bucket: 'secureblock-demo-bucket',
      region: 'us-east-1',
      timestamp: Date.now(),
      fileId,
      fileName: file?.name || 'Unknown',
      outcome: 'INFO',
      details: `DeleteObject: Purged ${file?.name || fileId} and removed all ${blocks.length} encrypted blocks from storage.`,
    } as ActivityRecord);
  });
}

/**
 * Appends a record to the persistent activity log.
 */
export async function logActivity(
  entry: Omit<ActivityRecord, 'id' | 'timestamp'>
): Promise<ActivityRecord> {
  const db = await getDb();
  const record: ActivityRecord = {
    storageMode: 'Demo Environment',
    bucket: 'secureblock-demo-bucket',
    region: 'us-east-1',
    ...entry,
    id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readwrite');
    const store = tx.objectStore('activity');
    const req = store.put(record);

    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetches all activity records, ordered chronologically descending.
 */
export async function getAllActivities(): Promise<ActivityRecord[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readonly');
    const store = tx.objectStore('activity');
    const req = store.getAll();

    req.onsuccess = () => {
      const records = (req.result as ActivityRecord[]) || [];
      records.sort((a, b) => b.timestamp - a.timestamp);
      resolve(records);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears all activity records.
 */
export async function clearActivities(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activity', 'readwrite');
    const store = tx.objectStore('activity');
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves vault settings, initializing with defaults if not set.
 */
export async function getVaultSettings(): Promise<VaultSettings> {
  const defaultSettings: VaultSettings = {
    defaultBlockSize: 65536, // 64 KiB
    autoVerifyOnDownload: true,
    theme: 'system',
    bucketName: 'secureblock-demo-bucket',
    awsRegion: 'us-east-1',
    awsConnectionStatus: 'NOT_CONFIGURED',
    awsConnectionMessage: 'Operating in Demo Environment (Local Vault IndexedDB)',
  };

  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const req = store.get('vault_settings');

    req.onsuccess = () => {
      if (req.result && req.result.value) {
        resolve({ ...defaultSettings, ...req.result.value });
      } else {
        resolve(defaultSettings);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Updates vault settings.
 */
export async function updateVaultSettings(
  partial: Partial<VaultSettings>
): Promise<VaultSettings> {
  const current = await getVaultSettings();
  const updated: VaultSettings = { ...current, ...partial };
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key: 'vault_settings', value: updated });

    req.onsuccess = () => resolve(updated);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Computes live storage stats strictly from actual IndexedDB records.
 */
export async function getStorageStats(): Promise<StorageStats> {
  const files = await getAllFiles();
  const blocks = await getAllBlocks();
  const activities = await getAllActivities();

  let totalEncryptedSize = 0;
  let totalOriginalSize = 0;

  for (const f of files) {
    totalOriginalSize += f.originalSize;
    totalEncryptedSize += f.encryptedSize;
  }

  const successfulVerifications = activities.filter(
    (a) => a.type === 'RECONSTRUCTION_PASSED'
  ).length;

  const failedVerifications = activities.filter(
    (a) => a.type === 'RECONSTRUCTION_FAILED'
  ).length;

  let quotaEstimate;
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || totalEncryptedSize;
      const quota = estimate.quota || 10737418240; // 10 GB fallback
      quotaEstimate = {
        usage,
        quota,
        percentUsed: Math.min(100, Math.max(0, (usage / quota) * 100)),
      };
    } catch {
      // Ignore quota error if browser forbids
    }
  }

  return {
    totalFiles: files.length,
    totalEncryptedSize,
    totalOriginalSize,
    totalBlocks: blocks.length,
    successfulVerifications,
    failedVerifications,
    quotaEstimate,
  };
}

/**
 * Clears the entire vault: purges files, blocks, activities, and settings.
 * Resets the master key only upon intentional full vault clear.
 */
export async function clearEntireVault(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'blocks', 'activity', 'settings', 'keys'], 'readwrite');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    tx.objectStore('files').clear();
    tx.objectStore('blocks').clear();
    tx.objectStore('activity').clear();
    tx.objectStore('settings').clear();
    tx.objectStore('keys').clear();
  });
}

/**
 * Serializes the current vault into an exportable JSON package.
 * Blocks are encoded in Base64 for clean JSON portability.
 * Includes the Master Vault Key (in raw base64) so that restored backups can actually be decrypted.
 */
export async function exportVaultBundle(): Promise<string> {
  const files = await getAllFiles();
  const blocks = await getAllBlocks();
  const settings = await getVaultSettings();

  // Export Master Key so restored vault can unwrap file keys
  let masterKeyBase64: string | undefined;
  try {
    const masterKey = await getMasterKey();
    const rawKey = await crypto.subtle.exportKey('raw', masterKey);
    masterKeyBase64 = arrayBufferToBase64(rawKey);
  } catch (err) {
    console.warn('Could not export master key for bundle:', err);
  }

  // Convert block ArrayBuffers to base64
  const serializedBlocks = blocks.map((b) => ({
    id: b.id,
    fileId: b.fileId,
    index: b.index,
    displayIndex: b.displayIndex,
    size: b.size,
    hash: b.hash,
    objectKey: b.objectKey,
    createdAt: b.createdAt,
    dataBase64: arrayBufferToBase64(b.data),
  }));

  // Convert FileRecord Uint8Array and ArrayBuffer fields to base64
  const serializedFiles = files.map((f) => ({
    ...f,
    ivBase64: arrayBufferToBase64(f.iv.buffer as ArrayBuffer),
    wrappedKeyBase64: arrayBufferToBase64(f.wrappedKey),
    wrapIvBase64: arrayBufferToBase64(f.wrapIv.buffer as ArrayBuffer),
  }));

  const bundle = {
    version: '1.0.0',
    exportTimestamp: Date.now(),
    system: 'SecureBlock Cloud Vault Export',
    masterKeyBase64,
    settings,
    files: serializedFiles,
    blocks: serializedBlocks,
  };

  return JSON.stringify(bundle, null, 2);
}

/**
 * Imports a previously exported vault bundle.
 * Validates the package, restores Master Key if applicable, and avoids silently overwriting unrelated files.
 */
export async function importVaultBundle(
  jsonString: string
): Promise<{ importedFiles: number; importedBlocks: number; skippedFiles: number }> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format in vault backup package.');
  }

  if (!parsed || !Array.isArray(parsed.files) || !Array.isArray(parsed.blocks)) {
    throw new Error('Invalid vault backup package: missing files or blocks collection.');
  }

  // Validate file records
  for (const f of parsed.files) {
    if (!f.id || !f.name || !f.originalHash || !f.wrappedKeyBase64 || !f.ivBase64) {
      throw new Error(`Corrupted file metadata in backup for "${f.name || 'unnamed'}".`);
    }
  }

  // Validate block records
  for (const b of parsed.blocks) {
    if (!b.id || !b.fileId || typeof b.index !== 'number' || !b.dataBase64 || !b.hash) {
      throw new Error(`Corrupted block record in backup for block index ${b.index}.`);
    }
  }

  const db = await getDb();

  // If backup includes a Master Key and current vault is empty of master key, restore it
  if (parsed.masterKeyBase64) {
    try {
      const importedMasterKey = await crypto.subtle.importKey(
        'raw',
        base64ToArrayBuffer(parsed.masterKeyBase64),
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
      );

      const keyTx = db.transaction('keys', 'readwrite');
      const keyStore = keyTx.objectStore('keys');
      const existingKeyReq = keyStore.get('master_vault_key');
      await new Promise<void>((res, rej) => {
        existingKeyReq.onsuccess = () => {
          if (!existingKeyReq.result || !existingKeyReq.result.key) {
            keyStore.put({
              id: 'master_vault_key',
              key: importedMasterKey,
              createdAt: Date.now(),
            });
          }
          res();
        };
        existingKeyReq.onerror = () => rej(existingKeyReq.error);
      });
    } catch (err) {
      console.warn('Failed to import backup master key:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'blocks', 'activity'], 'readwrite');
    let importedFiles = 0;
    let skippedFiles = 0;
    let importedBlocks = 0;

    tx.oncomplete = () =>
      resolve({
        importedFiles,
        importedBlocks,
        skippedFiles,
      });
    tx.onerror = () => reject(tx.error);

    const fileStore = tx.objectStore('files');
    const blockStore = tx.objectStore('blocks');

    // Get existing file IDs to prevent silent overwriting of unrelated files
    const allExistingReq = fileStore.getAllKeys();
    allExistingReq.onsuccess = () => {
      const existingIds = new Set(allExistingReq.result as string[]);

      for (const f of parsed.files) {
        if (existingIds.has(f.id)) {
          skippedFiles++;
          continue; // Do not overwrite existing file
        }

        const restoredFile: FileRecord = {
          id: f.id,
          name: f.name,
          extension: f.extension || '',
          mimeType: f.mimeType || 'application/octet-stream',
          originalSize: f.originalSize,
          originalHash: f.originalHash,
          algorithm: f.algorithm || 'AES-256-GCM',
          iv: new Uint8Array(base64ToArrayBuffer(f.ivBase64)),
          wrappedKey: base64ToArrayBuffer(f.wrappedKeyBase64),
          wrapIv: new Uint8Array(base64ToArrayBuffer(f.wrapIvBase64)),
          blockSize: f.blockSize || 65536,
          blockSizeLabel: f.blockSizeLabel || '64 KiB',
          encryptedSize: f.encryptedSize,
          blockCount: f.blockCount,
          createdAt: f.createdAt || Date.now(),
          lastVerifiedAt: f.lastVerifiedAt,
          lastVerifyStatus: f.lastVerifyStatus,
        };
        fileStore.put(restoredFile);
        importedFiles++;

        // Import matching blocks for this file
        const matchingBlocks = parsed.blocks.filter((b: any) => b.fileId === f.id);
        for (const b of matchingBlocks) {
          const restoredBlock: BlockRecord = {
            id: b.id,
            fileId: b.fileId,
            index: b.index,
            displayIndex: b.displayIndex || b.index + 1,
            data: base64ToArrayBuffer(b.dataBase64),
            size: b.size,
            hash: b.hash,
            objectKey: b.objectKey || `vault/${b.fileId}/blocks/block-${String(b.index + 1).padStart(4, '0')}.enc`,
            createdAt: b.createdAt || Date.now(),
          };
          blockStore.put(restoredBlock);
          importedBlocks++;
        }
      }

      tx.objectStore('activity').put({
        id: crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random()}`,
        type: 'BACKUP_IMPORTED',
        operation: 'RestoreBackup',
        storageMode: 'Demo Environment',
        bucket: 'secureblock-demo-bucket',
        region: 'us-east-1',
        timestamp: Date.now(),
        outcome: 'SUCCESS',
        details: `RestoreBackup: Restored ${importedFiles} files, ${importedBlocks} blocks (${skippedFiles} existing files skipped).`,
      } as ActivityRecord);
    };

    allExistingReq.onerror = () => reject(allExistingReq.error);
  });
}
