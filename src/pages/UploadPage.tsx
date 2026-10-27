import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Shield,
  Lock,
  ArrowRight,
  Copy,
  Check,
  Database,
  RefreshCw,
  X,
  FolderTree,
  Globe,
  FileText,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  BLOCK_SIZE_OPTIONS,
  BlockSizeOption,
  ProcessingStage,
  FileRecord,
  BlockRecord,
} from '../types';
import {
  calculateSha256,
  generateAesGcmKey,
  generateIv,
  encryptAesGcm,
  wrapFileKey,
  segmentCiphertextIntoBlocks,
} from '../services/crypto';
import { getMasterKey, persistFileWithBlocks } from '../services/db';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';

export const UploadPage: React.FC = () => {
  const { refreshVault, settings } = useVault();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBlockSize, setSelectedBlockSize] = useState<BlockSizeOption>(
    settings.defaultBlockSize || 65536
  );
  const [stage, setStage] = useState<ProcessingStage>('IDLE');
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedRecord, setCompletedRecord] = useState<FileRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    setCompletedRecord(null);
    setStage('IDLE');
  };

  const handleCancelSelection = () => {
    setSelectedFile(null);
    setStage('IDLE');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleStartPipeline = async () => {
    if (!selectedFile) return;

    setErrorMessage(null);
    const fileId = crypto.randomUUID
      ? crypto.randomUUID()
      : `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const extension = selectedFile.name.includes('.')
      ? selectedFile.name.split('.').pop() || ''
      : '';

    try {
      // 1. Reading file bytes
      setStage('READING_FILE');
      setStageProgress(15);
      const fileBytes = await selectedFile.arrayBuffer();

      // 2. Computing original SHA-256
      setStage('CALCULATING_HASH');
      setStageProgress(30);
      const originalSha256 = await calculateSha256(fileBytes);

      // 3. Generating AES-256 key & random IV
      setStage('GENERATING_KEY');
      setStageProgress(45);
      const fileKey = await generateAesGcmKey();
      const encryptionIv = generateIv(12);

      // 4. Encrypting with AES-256-GCM
      setStage('ENCRYPTING');
      setStageProgress(60);
      const encryptedPayload = await encryptAesGcm(fileBytes, fileKey, encryptionIv);

      // 5. Block segmentation & per-block hashes
      setStage('SPLITTING_BLOCKS');
      setStageProgress(75);
      const { blocks, totalEncryptedSize, blockCount } =
        await segmentCiphertextIntoBlocks(
          encryptedPayload,
          fileId,
          selectedBlockSize
        );

      // 6. Master key retrieval and key wrapping
      setStage('PERSISTING_BLOCKS');
      setStageProgress(90);
      const masterKey = await getMasterKey();
      const wrapIv = generateIv(12);
      const wrappedKey = await wrapFileKey(fileKey, masterKey, wrapIv);

      const blockSizeMeta = BLOCK_SIZE_OPTIONS.find((b) => b.size === selectedBlockSize);

      const fileRecord: FileRecord = {
        id: fileId,
        name: selectedFile.name,
        extension,
        mimeType: selectedFile.type || 'application/octet-stream',
        originalSize: selectedFile.size,
        originalHash: originalSha256,
        algorithm: 'AES-256-GCM',
        iv: encryptionIv,
        wrappedKey,
        wrapIv,
        blockSize: selectedBlockSize,
        blockSizeLabel: blockSizeMeta?.label || '64 KiB',
        encryptedSize: totalEncryptedSize,
        blockCount,
        createdAt: Date.now(),
      };

      // Persist atomically to IndexedDB with cloud metadata
      await persistFileWithBlocks(fileRecord, blocks as BlockRecord[]);

      // Update global vault context
      await refreshVault();

      setStage('COMPLETED');
      setStageProgress(100);
      setCompletedRecord(fileRecord);

      showToast({
        type: 'success',
        title: 'PutObject Complete',
        message: `Persisted ${fileRecord.name} into ${blockCount} encrypted blocks in ${settings.bucketName || 'secureblock-demo-bucket'}.`,
      });
    } catch (err: any) {
      console.error('Upload pipeline failed:', err);
      setStage('FAILED');
      setErrorMessage(
        err?.message || 'An error occurred during cryptographic processing or storage persistence.'
      );
      showToast({
        type: 'error',
        title: 'PutObject Failed',
        message: err?.message || 'Storage error.',
      });
    }
  };

  const handleCopyHash = () => {
    if (!completedRecord) return;
    navigator.clipboard.writeText(completedRecord.originalHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const stagesList = [
    { key: 'READING_FILE', label: '1. Reading Payload Bytes' },
    { key: 'CALCULATING_HASH', label: '2. SHA-256 Checksum' },
    { key: 'GENERATING_KEY', label: '3. AES-256 Key & 96-bit IV' },
    { key: 'ENCRYPTING', label: '4. AES-256-GCM Encrypt' },
    { key: 'SPLITTING_BLOCKS', label: '5. Block Segmentation' },
    { key: 'PERSISTING_BLOCKS', label: '6. PutObject Persistence' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* S3 Upload Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
            Upload Objects (PutObject)
          </h2>
          <Badge variant="default" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
            AES-256-GCM
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono">
          Destination: <span className="font-semibold text-slate-800">s3://{settings.bucketName || 'secureblock-demo-bucket'}/vault/</span> | Region: <span className="font-semibold text-slate-800">{settings.awsRegion || 'us-east-1'}</span>
        </p>
      </div>

      {/* S3 Bucket Info Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-lg p-3 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-brand-400 shrink-0" />
          <span>Bucket: <strong className="text-white">{settings.bucketName || 'secureblock-demo-bucket'}</strong></span>
          <span className="text-slate-500">•</span>
          <span>Storage Class: <strong className="text-white">STANDARD</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>Operating Mode:</span>
          <span className="text-amber-400 font-semibold">Demo Environment (Local Vault)</span>
        </div>
      </div>

      {/* Main Upload Card */}
      <Card title="File Selection & Block Segmentation Configuration">
        <div className="space-y-6">
          {/* File Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-brand-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                Drag and drop your file here, or{' '}
                <span className="text-brand-600 underline">browse files</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                Any file type supported. Files are encrypted client-side with AES-256-GCM and segmented into discrete binary block objects.
              </p>
            </div>
          ) : (
            /* Selected File Summary Card */
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold text-xs uppercase font-mono">
                  {selectedFile.name.split('.').pop()?.slice(0, 4) || 'FILE'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 break-all font-mono">
                    {selectedFile.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                    <span>{formatBytes(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-sans">{selectedFile.type || 'application/octet-stream'}</span>
                  </div>
                </div>
              </div>

              {stage === 'IDLE' && (
                <button
                  onClick={handleCancelSelection}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 p-1 font-mono"
                >
                  <X className="w-4 h-4" /> Change File
                </button>
              )}
            </div>
          )}

          {/* Block Size Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Select Block Segmentation Chunk Size
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Determines block granularity for storage objects
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {BLOCK_SIZE_OPTIONS.map((opt) => (
                <div
                  key={opt.size}
                  onClick={() => stage === 'IDLE' && setSelectedBlockSize(opt.size)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    stage !== 'IDLE' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    selectedBlockSize === opt.size
                      ? 'border-brand-600 bg-brand-50/40 shadow-xs ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {opt.label}
                    </span>
                    {selectedBlockSize === opt.size && (
                      <span className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    {opt.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-mono">
                    {opt.recommendedFor}
                  </p>
                </div>
              ))}
            </div>

            {selectedFile && (
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                Estimated segmentation: Approximately{' '}
                <strong className="text-slate-800">
                  {Math.max(1, Math.ceil(selectedFile.size / selectedBlockSize))}
                </strong>{' '}
                objects of {BLOCK_SIZE_OPTIONS.find((b) => b.size === selectedBlockSize)?.label}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pipeline Execution Failed</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          {stage === 'IDLE' && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                disabled={!selectedFile}
                onClick={handleStartPipeline}
                icon={<Lock className="w-4 h-4" />}
              >
                Execute PutObject & Encrypt
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Live Processing Pipeline Tracker */}
      {stage !== 'IDLE' && stage !== 'COMPLETED' && (
        <Card title="Live Cryptographic & PutObject Pipeline">
          <div className="space-y-5">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-mono">
                <span className="font-semibold text-slate-900">
                  Executing: {stage.replace(/_/g, ' ')}
                </span>
                <span>{stageProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {stagesList.map((s) => {
                const isCurrent = stage === s.key;
                return (
                  <div
                    key={s.key}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 font-mono ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-50/60 text-brand-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 text-brand-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Post-Upload Success Summary */}
      {stage === 'COMPLETED' && completedRecord && (
        <div className="space-y-6 animate-in fade-in zoom-in-98 duration-200">
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold font-mono">
                PutObject Succeeded: Stored in {settings.bucketName || 'secureblock-demo-bucket'}
              </h3>
              <p className="text-xs text-emerald-800 mt-1 font-mono">
                Payload encrypted using AES-256-GCM, divided into {completedRecord.blockCount} discrete binary blocks, and committed to storage.
              </p>
            </div>
          </div>

          <Card title="Object Manifest & Storage Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Parent Object Key
                </span>
                <p className="font-semibold text-slate-900 truncate" title={completedRecord.name}>
                  {completedRecord.name}
                </p>
                <p className="text-slate-500">
                  {formatBytes(completedRecord.originalSize)} ({completedRecord.mimeType})
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Encrypted Ciphertext Volume
                </span>
                <p className="font-semibold text-slate-900">
                  {formatBytes(completedRecord.encryptedSize)}
                </p>
                <p className="text-slate-500 text-[11px]">
                  Overhead: +16 bytes (AES-GCM 128-bit authentication tag)
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Block Segmentation
                </span>
                <p className="font-semibold text-slate-900">
                  {completedRecord.blockCount} Blocks ({completedRecord.blockSizeLabel} size)
                </p>
                <p className="text-slate-500 text-[11px]">
                  Key Prefix: `vault/{completedRecord.id.slice(0, 8)}.../blocks/`
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Storage Class & Encryption
                </span>
                <p className="font-semibold text-slate-900">
                  STANDARD • AES-256-GCM
                </p>
                <p className="text-slate-500 text-[11px]">
                  Local Master Key Wrapping
                </p>
              </div>
            </div>

            {/* SHA-256 Hash Display with Copy */}
            <div className="mt-4 p-3 rounded-lg bg-navy-900 text-slate-200 font-mono text-xs space-y-1.5 border border-navy-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider">
                <span>Original SHA-256 Checksum:</span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedHash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <p className="text-emerald-400 break-all select-all font-semibold">
                {completedRecord.originalHash}
              </p>
            </div>

            {/* Navigation Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setStage('IDLE');
                  setCompletedRecord(null);
                }}
              >
                Upload Another Object
              </Button>

              <div className="flex items-center gap-3">
                <Link to={`/blocks?fileId=${completedRecord.id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers className="w-4 h-4" />}
                  >
                    Inspect Blocks
                  </Button>
                </Link>
                <Link to={`/verify?fileId=${completedRecord.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileCheck className="w-4 h-4" />}
                  >
                    Verify & Reconstruct
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
