import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  FileText,
  Search,
  Eye,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FolderTree,
  Lock,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { HexViewer } from '../components/viewer/HexViewer';
import { getBlocksByFileId, tamperBlock } from '../services/db';
import { BlockRecord, FileRecord } from '../types';
import { useToast } from '../context/ToastContext';

export const BlockExplorerPage: React.FC = () => {
  const { files, refreshVault, settings } = useVault();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const fileIdParam = searchParams.get('fileId');
  const [selectedFileId, setSelectedFileId] = useState<string>(
    fileIdParam || (files.length > 0 ? files[0].id : '')
  );

  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockRecord | null>(null);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [isTampering, setIsTampering] = useState(false);

  // Pagination for files with large number of blocks
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Sync selected file when files change or query param changes
  useEffect(() => {
    if (fileIdParam && files.some((f) => f.id === fileIdParam)) {
      setSelectedFileId(fileIdParam);
    } else if (files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id);
    }
  }, [fileIdParam, files, selectedFileId]);

  // Load blocks whenever selectedFileId changes
  useEffect(() => {
    async function loadBlocks() {
      if (!selectedFileId) {
        setBlocks([]);
        setSelectedBlock(null);
        return;
      }
      setLoadingBlocks(true);
      try {
        const loaded = await getBlocksByFileId(selectedFileId);
        setBlocks(loaded);
        setSelectedBlock(loaded.length > 0 ? loaded[0] : null);
        setPage(1);
      } catch (err) {
        console.error('Failed to load blocks:', err);
      } finally {
        setLoadingBlocks(false);
      }
    }
    loadBlocks();
  }, [selectedFileId]);

  const activeFile = files.find((f) => f.id === selectedFileId);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId);
    setSearchParams({ fileId });
  };

  const handleTamperBlock = async (block: BlockRecord) => {
    setIsTampering(true);
    try {
      const tampered = await tamperBlock(block.id);
      showToast({
        type: 'warning',
        title: 'Tampering Simulated on Block #' + block.displayIndex,
        message: '1 byte inverted in storage. Head to "Download & Verify" to see the authentication tag reject this block!',
      });
      // Refresh current block and list
      const loaded = await getBlocksByFileId(selectedFileId);
      setBlocks(loaded);
      setSelectedBlock(tampered);
      await refreshVault();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Tampering simulation failed',
        message: err?.message,
      });
    } finally {
      setIsTampering(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const totalPages = Math.ceil(blocks.length / pageSize);
  const paginatedBlocks = blocks.slice((page - 1) * pageSize, page * pageSize);

  if (files.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              Encrypted Block Explorer
            </h2>
            <Badge variant="default" size="sm">AES-256-GCM</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Inspect raw AES-256-GCM ciphertext bytes, block headers, and individual SHA-256 checksums.
          </p>
        </div>
        <EmptyState
          icon={<Layers className="w-6 h-6 text-slate-400" />}
          title="No Encrypted Blocks in Bucket"
          description="Bucket secureblock-demo-bucket contains zero objects. Upload a file to segment it into numbered encrypted blocks."
          action={
            <Link to="/upload">
              <Button
                variant="primary"
                size="sm"
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Upload & Segment an Object
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* S3 Block Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              Encrypted Block Explorer
            </h2>
            <Badge variant="default" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
              Continuous Ordinal Indexing
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Inspect raw ciphertext bytes and SHA-256 block digests for objects in {settings.bucketName || 'secureblock-demo-bucket'}.
          </p>
        </div>

        {/* File Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap font-mono">
            Parent Object:
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
          {/* File Metadata Overview Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-100 text-sm truncate max-w-sm font-mono">
                  {activeFile.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                  <span>Encrypted: {formatBytes(activeFile.encryptedSize)}</span>
                  <span>•</span>
                  <span>Total Blocks: {activeFile.blockCount}</span>
                  <span>•</span>
                  <span>Block Size: {activeFile.blockSizeLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to={`/verify?fileId=${activeFile.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-mono"
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Verify Integrity
                </Button>
              </Link>
            </div>
          </div>

          {/* Block Selection Grid / Pagination */}
          <Card
            title={`Block Index List (${blocks.length} Total Blocks)`}
            subtitle="Click any block to inspect its raw ciphertext and verify its individual SHA-256 hash"
            action={
              totalPages > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          >
            {loadingBlocks ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Loading blocks from storage...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {paginatedBlocks.map((block) => {
                  const isSelected = selectedBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          Block #{block.displayIndex}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {formatBytes(block.size)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1.5 truncate" title={block.hash}>
                        hash: {block.hash.slice(0, 8)}...
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                        {block.objectKey.split('/').pop()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Hex Inspector for the Selected Block */}
          {selectedBlock && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-mono">
                    <Layers className="w-4 h-4 text-brand-600" />
                    Hexadecimal Inspector & Cryptographic Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    s3://{settings.bucketName || 'secureblock-demo-bucket'}/{selectedBlock.objectKey}
                  </p>
                </div>

                {/* Engineering Lab Tamper Simulator Button */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 hover:bg-amber-50 text-amber-900 font-mono"
                    onClick={() => handleTamperBlock(selectedBlock)}
                    loading={isTampering}
                    icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    title="Invert 1 byte in this block to demonstrate real SHA-256 and AES-GCM tampering detection"
                  >
                    Simulate Block Tamper (Attack Test)
                  </Button>
                </div>
              </div>

              {/* Hex Viewer Component */}
              <HexViewer
                data={selectedBlock.data}
                blockIndex={selectedBlock.displayIndex}
                objectKey={selectedBlock.objectKey}
                blockHash={selectedBlock.hash}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
