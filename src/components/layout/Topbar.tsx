import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  HardDrive,
  ShieldCheck,
  UploadCloud,
  X,
  Globe,
  Search,
  ExternalLink,
  Lock,
  ChevronDown,
  Layers,
  Database,
} from 'lucide-react';
import { Button } from '../common/Button';
import { useVault } from '../../context/VaultContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const AWS_REGIONS = [
  { id: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
  { id: 'us-west-2', label: 'us-west-2 (Oregon)' },
  { id: 'eu-west-1', label: 'eu-west-1 (Ireland)' },
  { id: 'ap-south-1', label: 'ap-south-1 (Mumbai)' },
];

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings, stats } = useVault();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [searchNav, setSearchNav] = useState('');
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const getPageMeta = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Storage Overview', breadcrumb: 'Buckets / secureblock-demo-bucket' };
      case '/upload':
        return { title: 'Upload Objects', breadcrumb: 'secureblock-demo-bucket / Upload' };
      case '/blocks':
        return { title: 'Block Explorer', breadcrumb: 'secureblock-demo-bucket / Blocks' };
      case '/objects':
        return { title: 'Object Browser', breadcrumb: 'secureblock-demo-bucket / Objects' };
      case '/verify':
        return { title: 'Download & Verify', breadcrumb: 'secureblock-demo-bucket / Verification' };
      case '/activity':
        return { title: 'Storage Access Log', breadcrumb: 'CloudTrail & Access Logs' };
      case '/docs':
        return { title: 'Architecture Documentation', breadcrumb: 'Documentation' };
      case '/settings':
        return { title: 'Bucket & Connection Settings', breadcrumb: 'Settings / Properties' };
      default:
        return { title: 'Cloud Console', breadcrumb: 'Console' };
    }
  };

  const { title, breadcrumb } = getPageMeta(location.pathname);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchNav.trim()) {
      navigate(`/objects?q=${encodeURIComponent(searchNav.trim())}`);
    }
  };

  const handleRegionChange = async (regionId: string) => {
    await updateSettings({ awsRegion: regionId });
    setShowRegionDropdown(false);
  };

  return (
    <>
      <header className="h-14 bg-navy-950 border-b border-navy-800 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 text-slate-200">
        {/* Left Side: Mobile Menu, Service Badge & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-navy-800 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-brand-600/30 text-brand-300 border border-brand-500/40 font-mono">
              S3 Console
            </span>
            <div className="hidden md:block h-4 w-px bg-navy-800" />
            <div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-xs">
                <span>{breadcrumb}</span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold text-slate-100 leading-tight">
                {title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: AWS Global Object Search */}
        <form
          onSubmit={handleGlobalSearch}
          className="hidden lg:flex items-center flex-1 max-w-md mx-6"
        >
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search objects, prefixes (e.g. vault/)... [Enter]"
              value={searchNav}
              onChange={(e) => setSearchNav(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
            />
          </div>
        </form>

        {/* Right Side: Region Dropdown, Storage Mode Indicator & Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AWS Region Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-900 hover:bg-navy-800 border border-navy-700 text-xs font-mono text-slate-300 transition-colors"
              title="AWS Region"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{settings.awsRegion || 'us-east-1'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRegionDropdown && (
              <div className="absolute right-0 mt-1 w-52 bg-navy-900 border border-navy-700 rounded-md shadow-xl py-1 z-50 text-xs font-mono">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-navy-800">
                  Select AWS Region
                </div>
                {AWS_REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRegionChange(r.id)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-navy-800 flex items-center justify-between ${
                      settings.awsRegion === r.id ? 'text-brand-400 font-bold bg-navy-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span>{r.label}</span>
                    {settings.awsRegion === r.id && <span className="text-[10px]">●</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Operating Mode Status Indicator */}
          <div
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-900 hover:bg-navy-800 border border-navy-700 cursor-pointer transition-colors"
            title="Click for storage console architecture status"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                settings.awsConnectionStatus === 'CONNECTED'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-medium text-slate-300">
              {settings.awsConnectionStatus === 'CONNECTED' ? (
                'AWS S3'
              ) : (
                <span className="flex items-center gap-1">
                  Demo Environment <span className="hidden sm:inline text-slate-400 text-[11px]">(Local Vault)</span>
                </span>
              )}
            </span>
          </div>

          {/* Quick Upload Button */}
          {location.pathname !== '/upload' && (
            <Link to="/upload">
              <Button
                variant="primary"
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-xs"
                icon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Upload
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Cloud Storage Architecture Status Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-xs"
            onClick={() => setShowInfoModal(false)}
          />
          <div className="relative bg-slate-900 rounded-xl shadow-2xl border border-navy-700 max-w-lg w-full p-6 z-10 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-navy-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand-600/20 border border-brand-500/40 text-brand-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    SecureBlock Cloud Storage Console
                  </h3>
                  <p className="text-xs text-slate-400">
                    Encrypted object storage, block-level inspection, and integrity verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-navy-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-navy-950/80 p-2.5 rounded border border-navy-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Active Bucket</span>
                  <span className="text-slate-100 font-semibold">{settings.bucketName || 'secureblock-demo-bucket'}</span>
                </div>
                <div className="bg-navy-950/80 p-2.5 rounded border border-navy-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Region</span>
                  <span className="text-slate-100 font-semibold">{settings.awsRegion || 'us-east-1'}</span>
                </div>
                <div className="bg-navy-950/80 p-2.5 rounded border border-navy-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Operating Mode</span>
                  <span className={settings.awsConnectionStatus === 'CONNECTED' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {settings.awsConnectionStatus === 'CONNECTED' ? 'AWS S3 Connected' : 'Demo Environment (Local Vault)'}
                  </span>
                </div>
                <div className="bg-navy-950/80 p-2.5 rounded border border-navy-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Encryption</span>
                  <span className="text-slate-100 font-semibold">AES-256-GCM (AEAD)</span>
                </div>
              </div>

              <div className="bg-navy-950/60 p-3 rounded-lg border border-navy-800 space-y-1.5">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Integrity Standard:</span>
                  <span className="text-slate-200 font-medium">SHA-256 Digest per block & file</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Key Management:</span>
                  <span className="text-slate-200 font-medium">Master Key wrapping (Web Crypto API)</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Storage Hierarchy:</span>
                  <span className="text-slate-200 font-medium">`vault/{'{fileId}'}/blocks/block-0001.enc`</span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-slate-400">Total Encrypted Objects:</span>
                  <span className="text-slate-200 font-medium">{stats.totalBlocks} blocks ({stats.totalFiles} parent files)</span>
                </div>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Operating in Demo Environment: all cryptographic operations and block persistence run in the client browser with strict origin isolation. Full architectural documentation and formal specs are available in the Documentation page.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-navy-800 pt-4">
              <Link
                to="/docs"
                onClick={() => setShowInfoModal(false)}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                View Full Documentation <ExternalLink className="w-3 h-3" />
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInfoModal(false)}
                className="bg-navy-800 hover:bg-navy-700 text-slate-200 border-navy-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
