import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  Database,
  ShieldCheck,
  History,
  BookOpen,
  Settings,
  Shield,
  HardDrive,
  Lock,
  FolderTree,
  FileCheck2,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { files, stats, settings } = useVault();

  const navItems = [
    {
      to: '/',
      label: 'Storage Overview',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      to: '/objects',
      label: 'Object Browser',
      icon: Database,
      badge: stats.totalBlocks > 0 ? `${stats.totalBlocks}` : undefined,
    },
    {
      to: '/upload',
      label: 'Upload Objects',
      icon: UploadCloud,
      badge: undefined,
    },
    {
      to: '/blocks',
      label: 'Block Explorer',
      icon: Layers,
      badge: stats.totalBlocks > 0 ? `${stats.totalBlocks}` : undefined,
    },
    {
      to: '/verify',
      label: 'Download & Verify',
      icon: ShieldCheck,
      badge: undefined,
    },
    {
      to: '/activity',
      label: 'Storage Access Log',
      icon: History,
      badge: undefined,
    },
    {
      to: '/settings',
      label: 'Bucket Properties',
      icon: Settings,
      badge: undefined,
    },
    {
      to: '/docs',
      label: 'Architecture Guide',
      icon: BookOpen,
      badge: undefined,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-950/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950 border-r border-navy-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-4 border-b border-navy-800 bg-navy-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Shield className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1">
                SecureBlock <span className="text-brand-400 font-semibold">Cloud</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Storage Engineering Console
              </span>
            </div>
          </div>
        </div>

        {/* Active Bucket Selector Banner */}
        <div className="px-3 pt-3 pb-2 border-b border-navy-800/80 bg-navy-900/40">
          <div className="p-2 rounded bg-navy-900/90 border border-navy-800 text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              <span>Active Bucket</span>
              <span className="text-slate-400">{settings.awsRegion || 'us-east-1'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold text-slate-100 truncate text-[11px]" title={settings.bucketName || 'secureblock-demo-bucket'}>
              <FolderTree className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="truncate">{settings.bucketName || 'secureblock-demo-bucket'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Amazon S3 Console Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500 font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-slate-100 border-l-2 border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-navy-800 text-slate-300 border border-navy-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* AWS S3 / Cryptographic Status Footer */}
        <div className="p-3 border-t border-navy-800 bg-navy-950">
          <div className="rounded bg-navy-900 border border-navy-800 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                Crypto Storage Engine
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono space-y-1">
              <div className="flex justify-between">
                <span>Default Encryption:</span>
                <span className="text-slate-200 font-semibold">AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span>Integrity Checksum:</span>
                <span className="text-slate-200 font-semibold">SHA-256</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Class:</span>
                <span className="text-slate-200 font-semibold">STANDARD</span>
              </div>
            </div>

            <div className="pt-2 border-t border-navy-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-brand-400" />
                <span>
                  {settings.awsConnectionStatus === 'CONNECTED' ? 'AWS S3' : 'Demo Environment'}
                </span>
              </span>
              <span className={settings.awsConnectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}>
                {settings.awsConnectionStatus === 'CONNECTED' ? 'CONNECTED' : 'LOCAL VAULT'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
