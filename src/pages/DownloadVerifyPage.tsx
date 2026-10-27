import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Download,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Layers,
  Copy,
  Check,
  UploadCloud,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldAlert,
  FolderTree,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import {
  prepareEncryptedPayloadDownload,
  prepareEncryptedPackageDownload,
  reconstructAndVerifyFile,
} from '../services/verification';
import { FileRecord, VerificationResult } from '../types';
import { useToast } from '../context/ToastContext';

export const DownloadVerifyPage: React.FC = () => {
  const { files, refreshVault, settings } = useVault();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const fileIdParam = searchParams.get('fileId');
  const [selectedFileId, setSelectedFileId] = useState<string>(
    fileIdParam || (files.length > 0 ? files[0].id : '')
  );

  const [isDownloadingEncrypted, setIsDownloadingEncrypted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [copiedOriginalHash, setCopiedOriginalHash] = useState(false);
  const [copiedReconHash, setCopiedReconHash] = useState(false);

  useEffect(() => {
    if (fileIdParam && files.some((f) => f.id === fileIdParam)) {
      setSelectedFileId(fileIdParam);
    } else if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    }
  }, [fileIdParam, files, selectedFileId]);

  // Reset verification state if user selects another file
  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setSearchParams({ fileId });
    setVerificationResult(null);
    setDecryptedBlob(null);
  };

  const activeFile = files.find((f) => f.id === selectedFileId);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 1. Download raw encrypted payload (.enc) - GetObject
  const handleDownloadEncrypted = async () => {
    if (!activeFile) return;
    setIsDownloadingEncrypted(true);
    try {
      const { blob, filename } = await prepareEncryptedPayloadDownload(activeFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'GetObject Complete',
        message: `Saved ${filename} (${formatBytes(blob.size)}) as raw encrypted payload.`,
      });
      await refreshVault();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'GetObject Failed',
        message: err?.message || 'Failed to reassemble ciphertext blocks.',
      });
    } finally {
      setIsDownloadingEncrypted(false);
    }
  };

  // 1b. Download standalone encrypted package with recovery envelope
  const [isDownloadingPackage, setIsDownloadingPackage] = useState(false);
  const handleDownloadPackage = async () => {
    if (!activeFile) return;
    setIsDownloadingPackage(true);
    try {
      const { blob, filename } = await prepareEncryptedPackageDownload(activeFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Encrypted Package Downloaded',
        message: `Saved ${filename} with block digests and recovery envelope metadata.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Package Download Failed',
        message: err?.message || 'Failed to generate encrypted package.',
      });
    } finally {
      setIsDownloadingPackage(false);
    }
  };

  // 2. Reconstruct original file, verify SHA-256 and AES-GCM
  const handleReconstructAndVerify = async () => {
    if (!activeFile) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setDecryptedBlob(null);

    try {
      const { result, decryptedBlob: blob } = await reconstructAndVerifyFile(activeFile);
      setVerificationResult(result);

      if (result.match && blob) {
        setDecryptedBlob(blob);
        showToast({
          type: 'success',
          title: 'VerifyIntegrity: MATCH',
          message: `Reconstructed hash matches original SHA-256 fingerprint in ${result.durationMs}ms.`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'VerifyIntegrity: FAILED',
          message: result.errorMessage || 'Checksum mismatch or authentication tag failure.',
        });
      }
      await refreshVault();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reconstruction Error',
        message: err?.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. Download reconstructed decrypted file
  const handleDownloadReconstructed = () => {
    if (!activeFile || !decryptedBlob) return;
    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Decrypted File Downloaded',
      message: `Downloaded original plaintext ${activeFile.name}.`,
    });
  };

  const handleCopyHash = (hash: string, type: 'original' | 'recon') => {
    navigator.clipboard.writeText(hash);
    if (type === 'original') {
      setCopiedOriginalHash(true);
      setTimeout(() => setCopiedOriginalHash(false), 2000);
    } else {
      setCopiedReconHash(true);
      setTimeout(() => setCopiedReconHash(false), 2000);
    }
    showToast({
      type: 'info',
      title: 'Hash Copied',
      message: hash,
    });
  };

  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              GetObject & Integrity Verification
            </h2>
            <Badge variant="default" size="sm">AES-256-GCM</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Reconstruct encrypted payloads and perform cryptographic SHA-256 integrity checks.
          </p>
        </div>
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6 text-slate-400" />}
          title="No Objects Available for Verification"
          description="Bucket secureblock-demo-bucket contains zero objects. Upload and encrypt a file to test the reassembly and cryptographic verification pipeline."
          action={
            <Link to="/upload">
              <Button
                variant="primary"
                size="sm"
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Upload First Object
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & File Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              GetObject & Integrity Verification
            </h2>
            <Badge variant="default" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
              AES-256-GCM
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Execute S3 GetObject reassembly, unwrap AES keys, and verify SHA-256 checksums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap font-mono">
            Target Object:
          </label>
          <select
            value={selectedFileId}
            onChange={(e) => handleSelectFile(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-xs max-w-xs truncate font-mono"
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.blockCount} blocks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* S3 Bucket Info Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-lg p-3 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-brand-400 shrink-0" />
          <span>Bucket: <strong className="text-white">{settings.bucketName || 'secureblock-demo-bucket'}</strong></span>
          <span className="text-slate-500">•</span>
          <span>Region: <strong className="text-white">{settings.awsRegion || 'us-east-1'}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>Operating Mode:</span>
          <span className="text-amber-400 font-semibold">Demo Environment (Local Vault)</span>
        </div>
      </div>

      {activeFile && (
        <>
          {/* Active File Overview Card */}
          <Card title="Stored Object Manifest & Keys">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  File Name
                </span>
                <p className="font-semibold text-slate-900 truncate mt-0.5" title={activeFile.name}>
                  {activeFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  MIME: {activeFile.mimeType}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Original / Encrypted Size
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {formatBytes(activeFile.originalSize)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Ciphertext: {formatBytes(activeFile.encryptedSize)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Block Segmentation
                </span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {activeFile.blockCount} Blocks
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Chunk: {activeFile.blockSizeLabel}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-sans">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block font-mono">
                  Stored Integrity Status
                </span>
                <div className="mt-1">
                  {activeFile.lastVerifyStatus === 'MATCH' ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED MATCH
                    </Badge>
                  ) : activeFile.lastVerifyStatus === 'MISMATCH' ? (
                    <Badge variant="danger" size="sm">
                      <AlertTriangle className="w-3 h-3" /> MISMATCH / TAMPER
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">UNVERIFIED</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Original Recorded Hash */}
            <div className="mt-4 p-3 rounded-lg bg-navy-900 text-slate-200 font-mono text-xs space-y-1 border border-navy-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider">
                <span>Original SHA-256 Checksum (Recorded at PutObject):</span>
                <button
                  onClick={() => handleCopyHash(activeFile.originalHash, 'original')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  {copiedOriginalHash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedOriginalHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <p className="text-emerald-400 break-all select-all font-semibold">
                {activeFile.originalHash}
              </p>
            </div>
          </Card>

          {/* Two Distinct Operations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operation 1: Download Raw Encrypted Payload */}
            <Card
              title="1. S3 GetObject (.enc Ciphertext)"
              subtitle="Reassemble ciphertext blocks into raw encrypted binary"
            >
              <div className="space-y-4 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Fetches all {activeFile.blockCount} blocks in order, validates each block's SHA-256
                  checksum, and concatenates them into a raw{' '}
                  <code className="text-blue-600 font-mono">.enc</code> binary file.
                </p>

                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cryptographic Note:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This payload contains raw AES-256-GCM ciphertext. It is mathematically
                    unreadable without the unique 12-byte IV and Master-wrapped encryption key.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full justify-center font-mono"
                    onClick={handleDownloadEncrypted}
                    loading={isDownloadingEncrypted}
                    icon={<Download className="w-4 h-4 text-slate-600" />}
                  >
                    Execute GetObject (.enc)
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono"
                    onClick={handleDownloadPackage}
                    loading={isDownloadingPackage}
                    icon={<Layers className="w-4 h-4 text-brand-600" />}
                  >
                    Export Encrypted Package (.sbpackage.json)
                  </Button>
                </div>
              </div>
            </Card>

            {/* Operation 2: Verify & Reconstruct Plaintext */}
            <Card
              title="2. S3 VerifyIntegrity & Decrypt"
              subtitle="End-to-end cryptographic integrity verification and reconstruction"
            >
              <div className="space-y-4 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Executes the full verification workflow: block continuity verification (0..N-1),
                  SHA-256 block checksum check, key unwrapping with Master Vault Key, and AES-256-GCM
                  authenticated decryption.
                </p>

                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-blue-900 space-y-1 font-mono text-[11px]">
                  <div className="font-semibold text-blue-800">Verification Steps:</div>
                  <div className="text-[10px] space-y-0.5">
                    <div>1. Block Continuity & Ordering Check</div>
                    <div>2. Individual Block SHA-256 Digests</div>
                    <div>3. Master Key Unwrap & AES-256-GCM AEAD Tag Authentication</div>
                    <div>4. Plaintext SHA-256 Benchmark Matching</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center font-mono shadow-xs"
                    onClick={handleReconstructAndVerify}
                    loading={isVerifying}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Execute VerifyIntegrity
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Verification Results Panel */}
          {verificationResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Card
                title={
                  verificationResult.match
                    ? 'Integrity Verification Succeeded: MATCH'
                    : 'Integrity Verification Failed: MISMATCH / TAMPER DETECTED'
                }
                subtitle={`Verification completed in ${verificationResult.durationMs}ms`}
                className={
                  verificationResult.match
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                }
              >
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      verificationResult.match
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {verificationResult.match ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm font-mono">
                        {verificationResult.match
                          ? 'Cryptographic Hash Match (100% Bit-for-Bit Authenticity)'
                          : 'Integrity Failure Detected'}
                      </h4>
                      <p className="text-xs mt-1 leading-relaxed">
                        {verificationResult.match
                          ? `All ${verificationResult.blockCount} blocks verified without error. The decrypted plaintext hash exactly matches the SHA-256 digest calculated at PutObject time.`
                          : verificationResult.errorMessage ||
                            'The reconstructed hash does not match the original file hash recorded at upload. Ciphertext or blocks may have been tampered with or corrupted.'}
                      </p>
                    </div>
                  </div>

                  {/* Hash Comparison Table */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase">
                        <span>Original SHA-256 Checksum:</span>
                        <button
                          onClick={() =>
                            handleCopyHash(verificationResult.originalHash, 'original')
                          }
                          className="hover:text-slate-800"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-slate-800 break-all select-all font-semibold">
                        {verificationResult.originalHash}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase">
                        <span>Reconstructed Plaintext SHA-256 Checksum:</span>
                        {verificationResult.reconstructedHash && (
                          <button
                            onClick={() =>
                              handleCopyHash(verificationResult.reconstructedHash, 'recon')
                            }
                            className="hover:text-slate-800"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <p
                        className={`break-all select-all font-semibold ${
                          verificationResult.match ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {verificationResult.reconstructedHash ||
                          '[DECRYPTION ABORTED — AUTHENTICATION TAG REJECTED]'}
                      </p>
                    </div>
                  </div>

                  {/* Reconstructed File Download Action */}
                  {verificationResult.match && decryptedBlob && (
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-emerald-900 font-mono">
                          Original File Reconstructed ({formatBytes(decryptedBlob.size)})
                        </p>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          Ready for download and verification in local applications.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        className="bg-emerald-600 hover:bg-emerald-700 font-mono"
                        onClick={handleDownloadReconstructed}
                        icon={<Download className="w-4 h-4" />}
                      >
                        Download Reconstructed File
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
