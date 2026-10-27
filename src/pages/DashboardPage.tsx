import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  HardDrive,
  Layers,
  ShieldCheck,
  UploadCloud,
  Lock,
  ArrowRight,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Check,
  FolderTree,
  ExternalLink,
  Shield,
  Activity,
  Globe,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { getAllActivities } from '../services/db';
import { ActivityRecord, FileRecord } from '../types';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { files, stats, deleteFile, settings } = useVault();
  const { showToast } = useToast();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedS3Uri, setCopiedS3Uri] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'metrics'>('overview');

  useEffect(() => {
    async function loadRecentActivity() {
      try {
        const list = await getAllActivities();
        setActivities(list.slice(0, 6));
      } catch (err) {
        console.error('Failed to load activities:', err);
      }
    }
    loadRecentActivity();
  }, [files]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleCopyS3Uri = () => {
    const s3Uri = `s3://${settings.bucketName || 'secureblock-demo-bucket'}/`;
    navigator.clipboard.writeText(s3Uri);
    setCopiedS3Uri(true);
    setTimeout(() => setCopiedS3Uri(false), 2000);
    showToast({
      type: 'success',
      title: 'Copied S3 URI',
      message: s3Uri,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFile(fileToDelete.id);
      showToast({
        type: 'info',
        title: 'DeleteObject Executed',
        message: `Purged ${fileToDelete.name} and removed ${fileToDelete.blockCount} encrypted blocks.`,
      });
      setFileToDelete(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'DeleteObject Failed',
        message: err?.message || 'Could not delete file records.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* S3 Bucket Header Banner */}
      <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-brand-400" />
                Amazon S3 Bucket
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-700">
                <Globe className="w-3 h-3 text-slate-400" />
                {settings.awsRegion || 'us-east-1'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Demo Environment (Local Vault)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                {settings.bucketName || 'secureblock-demo-bucket'}
              </h2>
              <button
                onClick={handleCopyS3Uri}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 p-1 rounded hover:bg-navy-800 font-mono transition-colors"
                title="Copy S3 URI"
              >
                {copiedS3Uri ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span className="text-[11px] hidden sm:inline">Copy S3 URI</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Encrypted object storage, block-level inspection, and integrity verification. Objects are segmented into discrete binary blocks encrypted with AES-256-GCM and verified with SHA-256.
            </p>
          </div>

          {/* S3 Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link to="/upload" className="flex-1 sm:flex-none">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 shadow-xs"
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Upload Objects
              </Button>
            </Link>
            <Link to="/objects" className="flex-1 sm:flex-none">
              <Button
                variant="secondary"
                size="md"
                className="w-full sm:w-auto bg-navy-800 hover:bg-navy-700 text-slate-200 border-navy-700"
                icon={<Eye className="w-4 h-4" />}
              >
                Browse Objects
              </Button>
            </Link>
          </div>
        </div>

        {/* AWS S3 Console Style Tabs */}
        <div className="flex items-center gap-6 mt-6 border-t border-navy-800 pt-3 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-1 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'text-brand-400 border-brand-500 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Bucket Overview & Objects
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-1 border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'text-brand-400 border-brand-500 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Properties & Cryptography
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-1 border-b-2 transition-colors ${
              activeTab === 'metrics'
                ? 'text-brand-400 border-brand-500 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Storage Metrics & Quota
          </button>
        </div>
      </div>

      {/* Cloud Storage KPI Overview Cards (Strictly actual records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encrypted Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Encrypted Storage</span>
            <HardDrive className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {formatBytes(stats.totalEncryptedSize)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {stats.totalOriginalSize > 0
              ? `Plaintext: ${formatBytes(stats.totalOriginalSize)} (+16B auth tag)`
              : '0 B ciphertext stored'}
          </div>
        </div>

        {/* Encrypted Objects Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Stored Objects (Blocks)</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats.totalBlocks}
            </span>
            <span className="text-xs text-slate-500">objects</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            Spread across {stats.totalFiles} parent file keys
          </div>
        </div>

        {/* Default Encryption */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Default Encryption</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              AES-256-GCM
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            AEAD 128-bit Tag • Wrapped Key
          </div>
        </div>

        {/* Integrity Verification Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Integrity Verifications</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats.successfulVerifications}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">PASSED</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {stats.failedVerifications > 0
              ? `${stats.failedVerifications} mismatch/tamper flagged`
              : 'Cryptographic SHA-256 digests'}
          </div>
        </div>
      </div>

      {/* Tab: Properties & Cryptography */}
      {activeTab === 'properties' && (
        <Card title="Bucket Properties & Cryptographic Configuration" subtitle="Amazon S3 compliant parameters and client encryption standard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider block">Bucket Metadata</span>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">Bucket Name:</span>
                <span className="font-bold text-slate-800">{settings.bucketName || 'secureblock-demo-bucket'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">AWS Region:</span>
                <span className="font-bold text-slate-800">{settings.awsRegion || 'us-east-1'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">Storage Class:</span>
                <span className="font-bold text-slate-800">STANDARD</span>
              </div>
              <div className="flex justify-between py-1 font-mono">
                <span className="text-slate-500">Operating Mode:</span>
                <span className="text-amber-600 font-semibold">Demo Environment (Local Vault)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider block">Security & Cryptography</span>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">Cipher Specification:</span>
                <span className="font-bold text-slate-800">AES-256-GCM (AEAD)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">Integrity Checksum:</span>
                <span className="font-bold text-slate-800">SHA-256 (Block & File)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 font-mono">
                <span className="text-slate-500">Key Management:</span>
                <span className="font-bold text-slate-800">Master Vault Wrapping</span>
              </div>
              <div className="flex justify-between py-1 font-mono">
                <span className="text-slate-500">Block Segmentation:</span>
                <span className="font-bold text-slate-800">Continuous Ordinal Indexing</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Storage Metrics */}
      {activeTab === 'metrics' && (
        <Card title="Storage Allocation & Performance Metrics" subtitle="Actual persisted records in client storage engine">
          <div className="space-y-4">
            {stats.quotaEstimate ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-xs text-slate-700 font-mono mb-2">
                  <span className="font-medium">IndexedDB Origin Storage Allocation:</span>
                  <span>{formatBytes(stats.quotaEstimate.usage)} / {formatBytes(stats.quotaEstimate.quota)} ({stats.quotaEstimate.percentUsed.toFixed(2)}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${Math.max(1, stats.quotaEstimate.percentUsed)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Storage quota query is available in standard browser environments supporting <code className="font-mono">navigator.storage.estimate()</code>.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 text-[10px] block uppercase">Files Stored</span>
                <span className="text-base font-bold text-slate-800">{stats.totalFiles}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 text-[10px] block uppercase">Ciphertext Blocks</span>
                <span className="text-base font-bold text-slate-800">{stats.totalBlocks}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 text-[10px] block uppercase">Plaintext Volume</span>
                <span className="text-base font-bold text-slate-800">{formatBytes(stats.totalOriginalSize)}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-slate-500 text-[10px] block uppercase">Encrypted Volume</span>
                <span className="text-base font-bold text-slate-800">{formatBytes(stats.totalEncryptedSize)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Objects Table (S3 Bucket Content View) */}
      <Card
        title="Stored Objects"
        subtitle={
          files.length === 0
            ? 'No objects in bucket'
            : `${files.length} parent file keys • ${stats.totalBlocks} total block objects in secureblock-demo-bucket`
        }
        action={
          files.length > 0 && (
            <Link to="/objects" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 font-mono">
              Open Object Browser <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )
        }
        padding={false}
      >
        {files.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ShieldCheck className="w-6 h-6 text-slate-400" />}
              title="Bucket is Empty"
              description="No objects are stored in secureblock-demo-bucket. Upload a file to trigger client-side AES-256-GCM encryption, block segmentation, and SHA-256 checksum calculation."
              action={
                <Link to="/upload">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<UploadCloud className="w-4 h-4" />}
                  >
                    Upload Object
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium uppercase tracking-wider text-[11px] font-mono">
                <tr>
                  <th className="py-3 px-6">Object Key / File Name</th>
                  <th className="py-3 px-4">Size (Orig / Enc)</th>
                  <th className="py-3 px-4">Blocks</th>
                  <th className="py-3 px-4">Storage Class</th>
                  <th className="py-3 px-4">SHA-256 Checksum</th>
                  <th className="py-3 px-4">Integrity Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 truncate max-w-xs" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            vault/{file.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <div>{formatBytes(file.originalSize)}</div>
                      <div className="text-[10px] text-slate-400">
                        enc: {formatBytes(file.encryptedSize)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {file.blockCount} blocks
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" size="sm">STANDARD</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500" title={file.originalHash}>
                      {file.originalHash.slice(0, 10)}...{file.originalHash.slice(-6)}
                    </td>
                    <td className="py-3 px-4">
                      {file.lastVerifyStatus === 'MATCH' ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3" /> MATCH
                        </Badge>
                      ) : file.lastVerifyStatus === 'MISMATCH' ? (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3" /> MISMATCH
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">UNVERIFIED</Badge>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/blocks?fileId=${file.id}`}>
                          <button
                            className="p-1.5 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Inspect Encrypted Blocks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link to={`/verify?fileId=${file.id}`}>
                          <button
                            className="p-1.5 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                            title="Verify Integrity and Reconstruct"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Object"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* S3 Storage Access Activity Log (CloudTrail style) */}
      <Card
        title="Recent Storage Operations"
        subtitle="Live event trail of S3-inspired operations executed against local vault"
        action={
          activities.length > 0 && (
            <Link to="/activity" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 font-mono">
              View All Access Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )
        }
      >
        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            No operations recorded yet. Uploading, verifying, or downloading objects will append audit records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Event Time</th>
                  <th className="py-2.5 px-3">API Operation</th>
                  <th className="py-2.5 px-3">Target Resource</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Storage Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {activities.map((act) => {
                  const opName = act.operation || (
                    act.type === 'FILE_UPLOADED' ? 'PutObject' :
                    act.type === 'ENCRYPTED_DOWNLOAD' ? 'GetObject' :
                    act.type === 'FILE_DELETED' ? 'DeleteObject' :
                    act.type === 'RECONSTRUCTION_PASSED' || act.type === 'RECONSTRUCTION_FAILED' ? 'VerifyIntegrity' :
                    act.type === 'BACKUP_IMPORTED' ? 'RestoreBackup' :
                    act.type.replace(/_/g, '')
                  );

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                          {opName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 truncate max-w-xs" title={act.fileName || act.details}>
                        {act.fileName || act.details.slice(0, 40)}
                      </td>
                      <td className="py-2.5 px-3">
                        {act.outcome === 'SUCCESS' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            200 OK
                          </span>
                        ) : act.outcome === 'FAILURE' ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            400 FAILED
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            WARNING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {act.storageMode || 'Demo Environment'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        title="Confirm DeleteObject"
        description="Permanently delete encrypted object and all segmented blocks from storage."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFileToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Confirm DeleteObject
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to execute <strong className="font-mono text-slate-900">DeleteObject</strong> for <strong className="text-slate-900 font-semibold">{fileToDelete?.name}</strong>?
          </p>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-800">
            This will permanently remove the parent key and purge all{' '}
            <strong className="font-mono">{fileToDelete?.blockCount}</strong> encrypted blocks
            from storage.
          </div>
        </div>
      </Modal>
    </div>
  );
};
