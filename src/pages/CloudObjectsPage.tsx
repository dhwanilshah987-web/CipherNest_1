import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Database,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Layers,
  Copy,
  Check,
  Eye,
  Trash2,
  HardDrive,
  ExternalLink,
  ShieldAlert,
  UploadCloud,
  Download,
  FolderTree,
  Lock,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { getAllBlocks } from '../services/db';
import { BlockRecord, FileRecord } from '../types';
import { useToast } from '../context/ToastContext';

export const CloudObjectsPage: React.FC = () => {
  const { files, deleteFile, settings } = useVault();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterFileId, setFilterFileId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'key' | 'size' | 'date' | 'index'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [inspectingObject, setInspectingObject] = useState<{
    block: BlockRecord;
    parentFile?: FileRecord;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedS3Uri, setCopiedS3Uri] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<FileRecord | null>(null);

  useEffect(() => {
    async function loadAllStoredObjects() {
      setLoading(true);
      try {
        const loaded = await getAllBlocks();
        setBlocks(loaded);
      } catch (err) {
        console.error('Failed to load storage objects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllStoredObjects();
  }, [files]);

  const filesMap = useMemo(() => {
    const map = new Map<string, FileRecord>();
    for (const f of files) {
      map.set(f.id, f);
    }
    return map;
  }, [files]);

  const filteredBlocks = useMemo(() => {
    let result = [...blocks];

    if (filterFileId !== 'ALL') {
      result = result.filter((b) => b.fileId === filterFileId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => {
        const parent = filesMap.get(b.fileId);
        return (
          b.objectKey.toLowerCase().includes(q) ||
          b.hash.toLowerCase().includes(q) ||
          (parent && parent.name.toLowerCase().includes(q))
        );
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'key') {
        cmp = a.objectKey.localeCompare(b.objectKey);
      } else if (sortBy === 'size') {
        cmp = a.size - b.size;
      } else if (sortBy === 'index') {
        cmp = a.index - b.index;
      } else {
        cmp = a.createdAt - b.createdAt;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [blocks, filterFileId, searchQuery, sortBy, sortOrder, filesMap]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleCopy = (text: string, type: 'hash' | 'key' | 's3uri') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedS3Uri(true);
      setTimeout(() => setCopiedS3Uri(false), 2000);
    }
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: text,
    });
  };

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId);
  }, [blocks, selectedBlockId]);

  const handleDownloadSingleBlockCiphertext = (block: BlockRecord) => {
    const blob = new Blob([block.data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `block-${String(block.displayIndex).padStart(4, '0')}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({
      type: 'info',
      title: 'Ciphertext Downloaded',
      message: `Downloaded raw encrypted bytes for ${block.objectKey}`,
    });
  };

  const handleDeleteParentConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await deleteFile(fileToDelete.id);
      showToast({
        type: 'info',
        title: 'DeleteObject Completed',
        message: `Purged ${fileToDelete.name} and removed all related storage objects.`,
      });
      setFileToDelete(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err?.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* S3 Objects Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              Amazon S3 Object Browser
            </h2>
            <Badge variant="default" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
              AES-256-GCM
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Bucket: <span className="font-semibold text-slate-800">{settings.bucketName || 'secureblock-demo-bucket'}</span> | Region: <span className="font-semibold text-slate-800">{settings.awsRegion || 'us-east-1'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/upload">
            <Button
              variant="primary"
              size="sm"
              icon={<UploadCloud className="w-4 h-4" />}
            >
              Upload Objects
            </Button>
          </Link>
        </div>
      </div>

      {/* S3 URI Path & Action Bar */}
      <div className="bg-navy-900 border border-navy-800 rounded-lg p-3 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-slate-400">URI:</span>
          <span className="text-brand-300 font-semibold select-all">
            s3://{settings.bucketName || 'secureblock-demo-bucket'}/vault/
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Total Objects: <strong className="text-white font-mono">{blocks.length}</strong></span>
          <span>•</span>
          <span>Parent Keys: <strong className="text-white font-mono">{files.length}</strong></span>
          <span>•</span>
          <span className="text-amber-400">Demo Environment</span>
        </div>
      </div>

      {/* S3 Console Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!selectedBlock}
            onClick={() => {
              if (selectedBlock) {
                handleCopy(
                  `s3://${settings.bucketName || 'secureblock-demo-bucket'}/${selectedBlock.objectKey}`,
                  's3uri'
                );
              }
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 font-mono transition-colors ${
              selectedBlock
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Copy S3 URI
          </button>

          <button
            disabled={!selectedBlock}
            onClick={() => {
              if (selectedBlock) {
                handleDownloadSingleBlockCiphertext(selectedBlock);
              }
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 font-mono transition-colors ${
              selectedBlock
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Download Ciphertext
          </button>

          <button
            disabled={!selectedBlock}
            onClick={() => {
              if (selectedBlock) {
                const parent = filesMap.get(selectedBlock.fileId);
                setInspectingObject({ block: selectedBlock, parentFile: parent });
              }
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center gap-1.5 font-mono transition-colors ${
              selectedBlock
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect Object
          </button>
        </div>

        {/* Search Prefix & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find objects by prefix or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>

          <select
            value={filterFileId}
            onChange={(e) => setFilterFileId(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none font-mono"
          >
            <option value="ALL">All Parent Files ({files.length})</option>
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb as any);
              setSortOrder(so as any);
            }}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none font-mono"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="key-asc">Key (A-Z)</option>
            <option value="size-desc">Largest Size</option>
            <option value="size-asc">Smallest Size</option>
          </select>
        </div>
      </div>

      {/* Cloud Objects Table */}
      <Card padding={false}>
        {blocks.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Database className="w-6 h-6 text-slate-400" />}
              title="No Objects in Bucket"
              description="No cloud storage objects exist yet. When you upload and encrypt a file, its segmented blocks are saved here with application-defined object keys."
              action={
                <Link to="/upload">
                  <Button variant="primary" size="sm" icon={<UploadCloud className="w-4 h-4" />}>
                    Upload First Object
                  </Button>
                </Link>
              }
            />
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            No objects match prefix "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-2.5 px-4">Object Key Name</th>
                  <th className="py-2.5 px-4">Storage Class</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Parent File</th>
                  <th className="py-2.5 px-4">Block #</th>
                  <th className="py-2.5 px-4">SHA-256 Checksum</th>
                  <th className="py-2.5 px-4">Encryption</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlocks.map((block) => {
                  const parent = filesMap.get(block.fileId);
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <tr
                      key={block.id}
                      onClick={() => setSelectedBlockId(isSelected ? null : block.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-brand-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span
                            className="font-medium text-slate-900 text-xs truncate max-w-xs select-all"
                            title={block.objectKey}
                          >
                            {block.objectKey}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        STANDARD
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 font-semibold">
                        {formatBytes(block.size)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-sans">
                        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate" title={parent?.name || block.fileId}>
                            {parent?.name || block.fileId}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        #{block.displayIndex}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]" title={block.hash}>
                        {block.hash.slice(0, 8)}...{block.hash.slice(-6)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          AES-256-GCM
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setInspectingObject({
                                block,
                                parentFile: parent,
                              })
                            }
                            className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                            title="Inspect Object Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link to={`/blocks?fileId=${block.fileId}`}>
                            <button
                              className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                              title="Block Explorer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </Link>
                          {parent && (
                            <button
                              onClick={() => setFileToDelete(parent)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title={`Delete file ${parent.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Object Details Modal */}
      <Modal
        isOpen={inspectingObject !== null}
        onClose={() => setInspectingObject(null)}
        title="S3 Object Overview & Metadata"
        description="Detailed record for segmented ciphertext block object in secureblock-demo-bucket."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (inspectingObject) {
                  handleDownloadSingleBlockCiphertext(inspectingObject.block);
                }
              }}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Download Ciphertext Block
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInspectingObject(null)}
            >
              Close
            </Button>
          </div>
        }
      >
        {inspectingObject && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-navy-900 rounded-lg text-slate-200 space-y-2 border border-navy-800">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider">
                <span>Object Key:</span>
                <button
                  onClick={() =>
                    handleCopy(inspectingObject.block.objectKey, 'key')
                  }
                  className="flex items-center gap-1 hover:text-white"
                >
                  {copiedKey ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <p className="text-brand-300 break-all select-all font-semibold">
                {inspectingObject.block.objectKey}
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-navy-800">
                S3 URI: s3://{settings.bucketName || 'secureblock-demo-bucket'}/{inspectingObject.block.objectKey}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-sans">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Parent File
                </span>
                <p className="font-semibold text-slate-900 truncate mt-0.5">
                  {inspectingObject.parentFile?.name || inspectingObject.block.fileId}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Block Number
                </span>
                <p className="font-semibold text-slate-900 font-mono mt-0.5">
                  Block #{inspectingObject.block.displayIndex} of{' '}
                  {inspectingObject.parentFile?.blockCount || '?'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Ciphertext Size
                </span>
                <p className="font-semibold text-slate-900 font-mono mt-0.5">
                  {formatBytes(inspectingObject.block.size)} ({inspectingObject.block.size.toLocaleString()} B)
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Storage Backend
                </span>
                <p className="font-semibold text-slate-900 font-mono mt-0.5">
                  IndexedDB (Demo Env)
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-semibold">
                <span>Block SHA-256 Checksum:</span>
                <button
                  onClick={() =>
                    handleCopy(inspectingObject.block.hash, 'hash')
                  }
                  className="flex items-center gap-1 hover:text-slate-800"
                >
                  {copiedHash ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
              </div>
              <p className="text-slate-800 break-all select-all text-[11px] font-semibold">
                {inspectingObject.block.hash}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Encryption Algorithm:</span>
                <span className="font-semibold text-slate-800">AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Class:</span>
                <span className="font-semibold text-slate-800">STANDARD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created:</span>
                <span className="text-slate-700">{new Date(inspectingObject.block.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Parent File Modal */}
      <Modal
        isOpen={fileToDelete !== null}
        onClose={() => setFileToDelete(null)}
        title="Confirm Object Deletion"
        description="Permanently delete parent file and all its segmented ciphertext blocks."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFileToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteParentConfirm}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete File & Blocks
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to delete <strong className="text-slate-900 font-semibold">{fileToDelete?.name}</strong>?
          </p>
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-800">
            This will purge the file entry and all {fileToDelete?.blockCount} encrypted block objects from storage.
          </div>
        </div>
      </Modal>
    </div>
  );
};
