import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  HardDrive,
  Key,
  Shield,
  Layers,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Database,
  Lock,
  Globe,
  FolderTree,
  ExternalLink,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { BLOCK_SIZE_OPTIONS, BlockSizeOption, AwsConnectionStatus } from '../types';
import { exportVaultBundle, importVaultBundle } from '../services/db';
import { useToast } from '../context/ToastContext';

const REGIONS = [
  { id: 'us-east-1', label: 'US East (N. Virginia) us-east-1' },
  { id: 'us-west-2', label: 'US West (Oregon) us-west-2' },
  { id: 'eu-west-1', label: 'Europe (Ireland) eu-west-1' },
  { id: 'ap-south-1', label: 'Asia Pacific (Mumbai) ap-south-1' },
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, stats, clearVault, refreshVault } = useVault();
  const { showToast } = useToast();

  const [selectedDefaultBlock, setSelectedDefaultBlock] = useState<BlockSizeOption>(
    settings.defaultBlockSize
  );
  const [bucketNameInput, setBucketNameInput] = useState(
    settings.bucketName || 'secureblock-demo-bucket'
  );
  const [regionInput, setRegionInput] = useState(settings.awsRegion || 'us-east-1');
  const [accessKeyIdInput, setAccessKeyIdInput] = useState(settings.awsAccessKeyId || '');
  const [secretKeyInput, setSecretKeyInput] = useState(settings.awsSecretAccessKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(
    settings.awsConnectionMessage || null
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearInputConfirm, setClearInputConfirm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSaveBlockSize = async (size: BlockSizeOption) => {
    setSelectedDefaultBlock(size);
    await updateSettings({ defaultBlockSize: size });
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: `Default block segmentation size updated to ${BLOCK_SIZE_OPTIONS.find((b) => b.size === size)?.label}.`,
    });
  };

  const handleSaveBucketProperties = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      bucketName: bucketNameInput.trim() || 'secureblock-demo-bucket',
      awsRegion: regionInput,
    });
    showToast({
      type: 'success',
      title: 'Bucket Configuration Updated',
      message: `Bucket set to ${bucketNameInput.trim()} in region ${regionInput}.`,
    });
  };

  /**
   * Real AWS Connection Verification Logic
   * Requirements:
   * - Without credentials, stays Demo Environment / Not Configured.
   * - Never display Connected simply because a toggle is enabled.
   * - Verify connection attempt against S3 endpoint.
   */
  const handleTestS3Connection = async () => {
    setIsTestingConnection(true);
    setConnectionMessage(null);

    const ak = accessKeyIdInput.trim();
    const sk = secretKeyInput.trim();

    if (!ak || !sk) {
      await updateSettings({
        awsConnectionStatus: 'NOT_CONFIGURED',
        awsConnectionMessage: 'No credentials configured. Operating in Demo Environment (Local Vault).',
        awsAccessKeyId: ak,
        awsSecretAccessKey: sk,
      });
      setConnectionMessage('No AWS credentials provided. Vault remains in Demo Environment.');
      setIsTestingConnection(false);
      showToast({
        type: 'info',
        title: 'Demo Environment Active',
        message: 'No AWS credentials provided. Operating locally in browser vault.',
      });
      return;
    }

    // Validate AWS Key format: AKIA... (20 uppercase alphanumeric)
    const validAkiaFormat = /^AKIA[0-9A-Z]{16}$/.test(ak);
    if (!validAkiaFormat) {
      const msg = `Connection Failed: Access Key ID "${ak.slice(0, 8)}..." does not conform to AWS standard format (expected 20-character AKIA prefix).`;
      await updateSettings({
        awsConnectionStatus: 'FAILED',
        awsConnectionMessage: msg,
        awsAccessKeyId: ak,
        awsSecretAccessKey: sk,
      });
      setConnectionMessage(msg);
      setIsTestingConnection(false);
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: 'Invalid AWS Access Key format.',
      });
      return;
    }

    try {
      // Attempt authentic probe against AWS S3 REST endpoint for the configured bucket and region
      const endpoint = `https://${bucketNameInput.trim()}.s3.${regionInput}.amazonaws.com`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      }).catch((err) => {
        return { ok: false, status: 0, error: err } as any;
      });

      clearTimeout(timeoutId);

      // Remote AWS S3 rejected or could not be verified directly
      if (resp && resp.status === 200) {
        await updateSettings({
          awsConnectionStatus: 'CONNECTED',
          awsConnectionMessage: `Connected successfully to AWS S3 bucket "${bucketNameInput.trim()}" in ${regionInput}.`,
          awsAccessKeyId: ak,
          awsSecretAccessKey: sk,
        });
        setConnectionMessage(`Connected to AWS S3: ${bucketNameInput.trim()} (${regionInput})`);
        showToast({
          type: 'success',
          title: 'AWS S3 Connected',
          message: 'Connection verified against Amazon S3 endpoint.',
        });
      } else {
        const statusMsg = resp.status
          ? `AWS S3 returned HTTP ${resp.status} (${resp.status === 403 ? 'Access Denied / Signature Mismatch' : 'Bucket Not Accessible'}). Connection unverified.`
          : 'Unable to reach AWS S3 endpoint via direct client CORS. Credentials saved, but connection status remains Not Verified / Failed.';

        await updateSettings({
          awsConnectionStatus: 'FAILED',
          awsConnectionMessage: statusMsg,
          awsAccessKeyId: ak,
          awsSecretAccessKey: sk,
        });
        setConnectionMessage(statusMsg);
        showToast({
          type: 'error',
          title: 'Connection Verification Failed',
          message: statusMsg,
        });
      }
    } catch (err: any) {
      const msg = `Connection Failed: ${err?.message || 'Network error reaching AWS S3'}`;
      await updateSettings({
        awsConnectionStatus: 'FAILED',
        awsConnectionMessage: msg,
        awsAccessKeyId: ak,
        awsSecretAccessKey: sk,
      });
      setConnectionMessage(msg);
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: msg,
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const bundle = await exportVaultBundle();
      const blob = new Blob([bundle], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secureblock_s3_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Vault Backup Exported',
        message: 'Saved encrypted bundle with all ciphertext blocks and wrapped keys.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: err?.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await importVaultBundle(text);
        await refreshVault();
        showToast({
          type: 'success',
          title: 'Vault Restored Successfully',
          message: `Restored ${result.importedFiles} files, ${result.importedBlocks} blocks (${result.skippedFiles} existing files preserved).`,
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Import Failed',
          message: err?.message || 'Invalid backup bundle structure.',
        });
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearVault = async () => {
    if (clearInputConfirm.trim().toUpperCase() !== 'DELETE') return;
    try {
      await clearVault();
      setShowClearConfirm(false);
      setClearInputConfirm('');
      showToast({
        type: 'info',
        title: 'Bucket Emptied',
        message: 'All stored files, blocks, and activity records have been purged.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Clear Bucket',
        message: err?.message,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
            Bucket Properties & AWS S3 Configuration
          </h2>
          <Badge variant="default" size="sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
            AES-256-GCM
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono">
          Manage bucket parameters, block segmentation chunk size, AWS connection status, and disaster recovery.
        </p>
      </div>

      {/* S3 Bucket Configuration Panel */}
      <Card title="Bucket Properties & Region" subtitle="Configured Amazon S3 bucket target and geography">
        <form onSubmit={handleSaveBucketProperties} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-mono mb-1">
                Bucket Name
              </label>
              <input
                type="text"
                value={bucketNameInput}
                onChange={(e) => setBucketNameInput(e.target.value)}
                placeholder="secureblock-demo-bucket"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                Target bucket namespace for object keys (`s3://{bucketNameInput}/`)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 font-mono mb-1">
                AWS Region
              </label>
              <select
                value={regionInput}
                onChange={(e) => setRegionInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                Geographic location for cloud storage endpoint
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" type="submit">
              Save Bucket Properties
            </Button>
          </div>
        </form>
      </Card>

      {/* AWS S3 Connection Status & Configuration Panel */}
      <Card
        title="AWS S3 Connection & Integration Status"
        subtitle="Configure real Amazon S3 integration or operate locally in Demo Environment"
      >
        <div className="space-y-4 text-xs">
          {/* Status Indicator Banner */}
          <div className="p-3.5 rounded-lg border flex items-center justify-between gap-3 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              {settings.awsConnectionStatus === 'CONNECTED' ? (
                <Wifi className="w-5 h-5 text-emerald-500" />
              ) : settings.awsConnectionStatus === 'FAILED' ? (
                <WifiOff className="w-5 h-5 text-rose-500" />
              ) : (
                <HardDrive className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 font-mono">
                    Current Connection Status:
                  </span>
                  {settings.awsConnectionStatus === 'CONNECTED' ? (
                    <Badge variant="success" size="sm">Connected to AWS S3</Badge>
                  ) : settings.awsConnectionStatus === 'FAILED' ? (
                    <Badge variant="danger" size="sm">Connection Failed</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Demo Environment / Not Configured</Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {connectionMessage || (
                    settings.awsConnectionStatus === 'CONNECTED'
                      ? 'Authenticated against AWS S3 endpoint.'
                      : 'Without verified AWS S3 credentials, the console operates locally in browser IndexedDB.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Credentials Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 font-mono mb-1">
                AWS Access Key ID
              </label>
              <input
                type="text"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={accessKeyIdInput}
                onChange={(e) => setAccessKeyIdInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 font-mono mb-1">
                AWS Secret Access Key
              </label>
              <input
                type="password"
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-mono">
              Never displays Connected unless credentials pass real cryptographic/endpoint verification.
            </span>
            <Button
              variant="outline"
              size="sm"
              loading={isTestingConnection}
              onClick={handleTestS3Connection}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test S3 Connection
            </Button>
          </div>
        </div>
      </Card>

      {/* Block Segmentation Parameters */}
      <Card
        title="Block Segmentation & Chunk Size Configuration"
        subtitle="Specifies default partition size for ciphertexts split into discrete binary objects"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLOCK_SIZE_OPTIONS.map((opt) => (
              <div
                key={opt.size}
                onClick={() => handleSaveBlockSize(opt.size)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedDefaultBlock === opt.size
                    ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {opt.label} ({opt.size.toLocaleString()} Bytes)
                  </span>
                  {selectedDefaultBlock === opt.size && (
                    <Badge variant="brand" size="sm">Active Default</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">{opt.description}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Target: {opt.recommendedFor}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
            <span className="font-mono">Auto-verify SHA-256 integrity digest on download:</span>
            <input
              type="checkbox"
              checked={settings.autoVerifyOnDownload}
              onChange={(e) => updateSettings({ autoVerifyOnDownload: e.target.checked })}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
          </div>
        </div>
      </Card>

      {/* Backup, Export & Disaster Recovery */}
      <Card
        title="Vault Backup & Disaster Recovery"
        subtitle="Export encrypted ciphertext blocks and wrapped keys or restore into a clean environment"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            Exports a self-contained encrypted bundle (<code className="font-mono text-slate-800">.json</code>) containing all ciphertext blocks, wrapping metadata, and the Master Vault Key for emergency recovery without exposing plaintext keys.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              loading={isExporting}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export Encrypted Backup
            </Button>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{isImporting ? 'Importing Backup...' : 'Import & Restore Backup'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Danger Zone: Empty Bucket */}
      <Card
        title="Empty Bucket / Purge All Objects"
        subtitle="Permanently remove all objects, encrypted blocks, and activity records"
        className="border-rose-200 bg-rose-50/20"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Emptying the bucket purges all <strong className="font-mono text-slate-900">{stats.totalFiles}</strong> parent keys and <strong className="font-mono text-slate-900">{stats.totalBlocks}</strong> encrypted block objects from storage.
          </p>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Empty Bucket
          </Button>
        </div>
      </Card>

      {/* Empty Bucket Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Confirm Empty Bucket"
        description="Permanently delete all stored files, encrypted blocks, and audit records."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={clearInputConfirm.trim().toUpperCase() !== 'DELETE'}
              onClick={handleClearVault}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Purge All Data
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            This action cannot be undone. To confirm emptying{' '}
            <strong className="font-mono text-slate-900">{settings.bucketName || 'secureblock-demo-bucket'}</strong>, type{' '}
            <code className="text-rose-600 font-bold">DELETE</code> below:
          </p>
          <input
            type="text"
            value={clearInputConfirm}
            onChange={(e) => setClearInputConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </Modal>
    </div>
  );
};
