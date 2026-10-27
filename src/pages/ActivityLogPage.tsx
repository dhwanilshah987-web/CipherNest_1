import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Download,
  Calendar,
  FileText,
  Clock,
  FolderTree,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { getAllActivities, clearActivities } from '../services/db';
import { ActivityRecord, CloudStorageOperation } from '../types';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';

export const ActivityLogPage: React.FC = () => {
  const { settings } = useVault();
  const { showToast } = useToast();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [opFilter, setOpFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const list = await getAllActivities();
      setActivities(list);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const getResolvedOperation = (act: ActivityRecord): CloudStorageOperation => {
    if (act.operation) return act.operation;
    switch (act.type) {
      case 'FILE_UPLOADED':
        return 'PutObject';
      case 'ENCRYPTED_DOWNLOAD':
        return 'GetObject';
      case 'FILE_DELETED':
        return 'DeleteObject';
      case 'RECONSTRUCTION_PASSED':
      case 'RECONSTRUCTION_FAILED':
      case 'BLOCK_TAMPERED':
        return 'VerifyIntegrity';
      case 'BACKUP_IMPORTED':
        return 'RestoreBackup';
      default:
        return 'PutObject';
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const op = getResolvedOperation(act);
      if (opFilter !== 'ALL' && op !== opFilter) return false;
      if (outcomeFilter !== 'ALL' && act.outcome !== outcomeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.details.toLowerCase().includes(q) ||
          op.toLowerCase().includes(q) ||
          (act.fileName && act.fileName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activities, opFilter, outcomeFilter, searchQuery]);

  const handleExportJson = () => {
    const formatted = activities.map((a) => ({
      ...a,
      operation: getResolvedOperation(a),
      storageMode: a.storageMode || (settings.awsConnectionStatus === 'CONNECTED' ? 'AWS S3' : 'Demo Environment'),
      bucket: a.bucket || settings.bucketName || 'secureblock-demo-bucket',
      region: a.region || settings.awsRegion || 'us-east-1',
    }));

    const jsonStr = JSON.stringify(formatted, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s3_access_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Access Logs Exported',
      message: `Exported ${activities.length} S3 operational records to JSON.`,
    });
  };

  const handleClearConfirm = async () => {
    try {
      await clearActivities();
      setActivities([]);
      setShowClearConfirm(false);
      showToast({
        type: 'info',
        title: 'Access Logs Cleared',
        message: 'All persistent operational records have been cleared from local storage.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Clear Logs',
        message: err?.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* S3 Access Log Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              Storage Access & Audit Logs
            </h2>
            <Badge variant="default" size="sm">
              <Activity className="w-3 h-3 mr-1 text-brand-600" />
              S3 CloudTrail Style
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Persistent audit trail of PutObject, GetObject, DeleteObject, and VerifyIntegrity operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                onClick={() => setShowClearConfirm(true)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear Log
              </Button>
            </>
          )}
        </div>
      </div>

      {/* S3 Bucket Banner */}
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
          <span>•</span>
          <span>Total Records: <strong className="text-white">{activities.length}</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by file name, keyword, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Operation Filter */}
          <select
            value={opFilter}
            onChange={(e) => setOpFilter(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none font-mono"
          >
            <option value="ALL">All API Operations</option>
            <option value="PutObject">PutObject</option>
            <option value="GetObject">GetObject</option>
            <option value="DeleteObject">DeleteObject</option>
            <option value="VerifyIntegrity">VerifyIntegrity</option>
            <option value="RestoreBackup">RestoreBackup</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">200 OK / Success</option>
            <option value="FAILURE">400 Error / Failure</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* S3 Storage Access Log Table */}
      <Card padding={false}>
        {activities.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<History className="w-6 h-6 text-slate-400" />}
              title="Access Log is Empty"
              description="No cloud operations recorded yet. Every PutObject, GetObject, DeleteObject, and VerifyIntegrity operation will create a persistent entry here."
            />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            No access logs match current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Event Time</th>
                  <th className="py-2.5 px-4">API Operation</th>
                  <th className="py-2.5 px-4">Target Resource</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Storage Mode</th>
                  <th className="py-2.5 px-6">Operation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                  const op = getResolvedOperation(act);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        <div>{new Date(act.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {op}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-800">
                        {act.fileName ? (
                          <div className="flex items-center gap-1.5 max-w-[180px] truncate" title={act.fileName}>
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate font-medium">{act.fileName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            {act.fileId || settings.bucketName || 'secureblock-demo-bucket'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {act.outcome === 'SUCCESS' ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            200 OK
                          </span>
                        ) : act.outcome === 'FAILURE' ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            400 FAILED
                          </span>
                        ) : act.outcome === 'WARNING' ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            WARNING
                          </span>
                        ) : (
                          <span className="text-blue-700 font-semibold text-[11px]">
                            INFO
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {act.storageMode || 'Demo Environment'}
                      </td>
                      <td className="py-2.5 px-6 font-sans text-slate-600 text-xs leading-relaxed max-w-md">
                        {act.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Clear Log Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Purge Access Logs"
        description="Permanently delete all persistent operational activity records."
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
              onClick={handleClearConfirm}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Purge All Records
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Are you sure you want to clear the entire access log? This will remove all{' '}
            <strong className="font-mono text-slate-900">{activities.length}</strong> recorded
            operational entries from local storage.
          </p>
        </div>
      </Modal>
    </div>
  );
};
