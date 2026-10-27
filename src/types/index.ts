export type BlockSizeOption = 1024 | 65536 | 1048576 | 4194304;

export interface BlockSizeMeta {
  size: BlockSizeOption;
  label: string;
  description: string;
  recommendedFor: string;
}

export const BLOCK_SIZE_OPTIONS: BlockSizeMeta[] = [
  {
    size: 1024,
    label: '1 KiB',
    description: 'Ultra-granular block segmentation',
    recommendedFor: 'Small files or high-granularity demo',
  },
  {
    size: 65536,
    label: '64 KiB',
    description: 'Balanced performance and block distribution',
    recommendedFor: 'Recommended default for general files',
  },
  {
    size: 1048576,
    label: '1 MiB',
    description: 'High throughput block sizing',
    recommendedFor: 'Media files and larger documents',
  },
  {
    size: 4194304,
    label: '4 MiB',
    description: 'Cloud object chunk standard (similar to AWS S3 multipart)',
    recommendedFor: 'Large files exceeding 10 MB',
  },
];

export interface FileRecord {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  originalSize: number;
  originalHash: string; // SHA-256 in hex
  algorithm: 'AES-256-GCM';
  iv: Uint8Array; // 12-byte initialization vector
  wrappedKey: ArrayBuffer; // AES-256 file key wrapped by Master Key
  wrapIv: Uint8Array; // 12-byte IV used for wrapping
  blockSize: BlockSizeOption;
  blockSizeLabel: string;
  encryptedSize: number;
  blockCount: number;
  createdAt: number;
  lastVerifiedAt?: number;
  lastVerifyStatus?: 'MATCH' | 'MISMATCH';
}

export interface BlockRecord {
  id: string; // `${fileId}_block_${index}`
  fileId: string;
  index: number;
  displayIndex: number;
  data: ArrayBuffer; // Raw ciphertext bytes
  size: number;
  hash: string; // SHA-256 of this block's ciphertext
  objectKey: string; // vault/{fileId}/blocks/block-0001.enc
  createdAt: number;
}

export type CloudStorageOperation =
  | 'PutObject'
  | 'GetObject'
  | 'ListObjects'
  | 'DeleteObject'
  | 'EncryptFile'
  | 'VerifyIntegrity'
  | 'HeadBucket'
  | 'RestoreBackup';

export type ActivityType =
  | 'FILE_UPLOADED'
  | 'HASH_CALCULATED'
  | 'ENCRYPTED'
  | 'BLOCKS_PERSISTED'
  | 'ENCRYPTED_DOWNLOAD'
  | 'RECONSTRUCTION_PASSED'
  | 'RECONSTRUCTION_FAILED'
  | 'FILE_DELETED'
  | 'VAULT_CLEARED'
  | 'BACKUP_EXPORTED'
  | 'BACKUP_IMPORTED'
  | 'BLOCK_TAMPERED';

export type ActivityOutcome = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  operation?: CloudStorageOperation;
  timestamp: number;
  fileId?: string;
  fileName?: string;
  outcome: ActivityOutcome;
  details: string;
  storageMode?: string;
  bucket?: string;
  region?: string;
}

export type AwsConnectionStatus = 'NOT_CONFIGURED' | 'FAILED' | 'CONNECTED';

export interface VaultSettings {
  defaultBlockSize: BlockSizeOption;
  autoVerifyOnDownload: boolean;
  theme: 'system' | 'light';
  bucketName: string;
  awsRegion: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsConnectionStatus: AwsConnectionStatus;
  awsConnectionMessage?: string;
}

export interface VerificationResult {
  fileId: string;
  fileName: string;
  originalHash: string;
  reconstructedHash: string;
  match: boolean;
  blockCount: number;
  validBlocks: number;
  decryptionStatus: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  durationMs: number;
  timestamp: number;
}

export interface StorageStats {
  totalFiles: number;
  totalEncryptedSize: number;
  totalOriginalSize: number;
  totalBlocks: number;
  successfulVerifications: number;
  failedVerifications: number;
  quotaEstimate?: {
    usage: number;
    quota: number;
    percentUsed: number;
  };
}

export type ProcessingStage =
  | 'IDLE'
  | 'READING_FILE'
  | 'CALCULATING_HASH'
  | 'GENERATING_KEY'
  | 'ENCRYPTING'
  | 'SPLITTING_BLOCKS'
  | 'PERSISTING_BLOCKS'
  | 'COMPLETED'
  | 'FAILED';
