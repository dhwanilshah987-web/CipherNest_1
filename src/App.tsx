import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  HardDrive, 
  FileText, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Upload, 
  Search, 
  Terminal, 
  Key, 
  Database, 
  Layers, 
  Sliders, 
  Eye, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Zap, 
  Radio, 
  Clock, 
  FileCode, 
  Check, 
  X, 
  HelpCircle,
  Menu,
  ChevronRight,
  ShieldCheck,
  Binary,
  Share2,
  Info
} from 'lucide-react';

// --- MOCK CONSTANTS & DATA ---
const INITIAL_FILES = [
  {
    id: 'cn-f-001',
    name: 'q3_financial_audit_2026.pdf',
    size: 4829104, // ~4.6 MB
    mimeType: 'application/pdf',
    uploadDate: '2026-10-24T14:32:10Z',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    blockHeight: 1849204,
    txHash: '0x9a8f7c6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a',
    status: 'VERIFIED',
    encryptionAlgo: 'AES-256-GCM',
    tags: ['Finance', 'Audit', 'Confidential']
  },
  {
    id: 'cn-f-002',
    name: 'quantum_encryption_keys_v2.pem',
    size: 10248, // ~10 KB
    mimeType: 'text/plain',
    uploadDate: '2026-10-25T09:15:42Z',
    sha256: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    blockHeight: 1849412,
    txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    status: 'VERIFIED',
    encryptionAlgo: 'AES-256-GCM',
    tags: ['Keys', 'Security', 'Root']
  },
  {
    id: 'cn-f-003',
    name: 'core_neural_weights_checkpoint.bin',
    size: 154829104, // ~147.6 MB
    mimeType: 'application/octet-stream',
    uploadDate: '2026-10-26T18:02:59Z',
    sha256: '45d3e0bfa9c87d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e',
    blockHeight: 1849890,
    txHash: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    status: 'VERIFIED',
    encryptionAlgo: 'ChaCha20-Poly1305',
    tags: ['AI', 'Weights', 'Internal']
  },
  {
    id: 'cn-f-004',
    name: 'patient_genomic_sequence_batch4.dat',
    size: 89429104, // ~85.2 MB
    mimeType: 'application/octet-stream',
    uploadDate: '2026-10-27T11:45:00Z',
    sha256: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    blockHeight: 1850110,
    txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    status: 'VERIFIED',
    encryptionAlgo: 'AES-256-GCM',
    tags: ['Biomed', 'Protected']
  }
];

const INITIAL_BLOCKS = [
  {
    height: 1850110,
    hash: '0x0000000000000000000789ab9876543210fedcba9876543210123456789abcde',
    prevHash: '0x0000000000000000000456789876543210fedcba9876543210123456789abcdd',
    merkleRoot: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    txCount: 14,
    timestamp: '2026-10-27T11:45:00Z',
    validator: 'Node-Emerald-01',
    sizeKb: 142
  },
  {
    height: 1849890,
    hash: '0x0000000000000000000456789876543210fedcba9876543210123456789abcdd',
    prevHash: '0x0000000000000000000123459876543210fedcba9876543210123456789abcdc',
    merkleRoot: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    txCount: 32,
    timestamp: '2026-10-26T18:02:59Z',
    validator: 'Node-Gold-04',
    sizeKb: 288
  },
  {
    height: 1849412,
    hash: '0x0000000000000000000123459876543210fedcba9876543210123456789abcdc',
    prevHash: '0x0000000000000000000987659876543210fedcba9876543210123456789abcdb',
    merkleRoot: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    txCount: 8,
    timestamp: '2026-10-25T09:15:42Z',
    validator: 'Node-Emerald-02',
    sizeKb: 96
  }
];

const INITIAL_LOGS = [
  { id: 'log-1', action: 'VERIFY', target: 'patient_genomic_sequence_batch4.dat', hash: '3a4b...3a4b', timestamp: '10 mins ago', status: 'SUCCESS' },
  { id: 'log-2', action: 'ENCRYPT', target: 'patient_genomic_sequence_batch4.dat', hash: '3a4b...3a4b', timestamp: '1 hour ago', status: 'SUCCESS' },
  { id: 'log-3', action: 'ENCRYPT', target: 'core_neural_weights_checkpoint.bin', hash: '45d3...3d2e', timestamp: 'Yesterday', status: 'SUCCESS' },
  { id: 'log-4', action: 'DECRYPT', target: 'quantum_encryption_keys_v2.pem', hash: '8f43...7aa4', timestamp: '2 days ago', status: 'SUCCESS' },
  { id: 'log-5', action: 'KEY_ROTATION', target: 'AES-GCM Root Key #4', hash: 'N/A', timestamp: '3 days ago', status: 'SUCCESS' }
];

// Helper formatting utilities
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const truncateHash = (hash, front = 6, back = 6) => {
  if (!hash) return '';
  if (hash.length <= front + back) return hash;
  return `${hash.substring(0, front)}...${hash.substring(hash.length - back)}`;
};

// Generate Hex Preview mock string
const generateHexDump = (str, len = 256) => {
  const result = [];
  const chars = '0123456789ABCDEF';
  let address = 0;
  
  for (let i = 0; i < len; i += 16) {
    const addrHex = address.toString(16).padStart(8, '0').toUpperCase();
    const hexBytes = [];
    const ascii = [];
    
    for (let j = 0; j < 16; j++) {
      if (i + j < len) {
        // Generate pseudo-deterministic byte based on input text & position
        const charCode = (str.charCodeAt((i + j) % str.length) + i + j * 7) % 256;
        const hex = charCode.toString(16).padStart(2, '0').toUpperCase();
        hexBytes.push(hex);
        ascii.push(charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : '.');
      } else {
        hexBytes.push('  ');
        ascii.push(' ');
      }
    }
    
    const hexPart1 = hexBytes.slice(0, 8).join(' ');
    const hexPart2 = hexBytes.slice(8, 16).join(' ');
    result.push({
      address: addrHex,
      hex: `${hexPart1}  ${hexPart2}`,
      ascii: ascii.join('')
    });
    address += 16;
  }
  return result;
};

// Simulated SHA-256 for browser demo
async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Storage State
  const [files, setFiles] = useState(INITIAL_FILES);
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [activityLogs, setActivityLogs] = useState(INITIAL_LOGS);
  
  // Settings State
  const [settings, setSettings] = useState({
    defaultAlgo: 'AES-256-GCM',
    autoCommit: true,
    nodeRegion: 'us-east-emerald-1',
    storageLimitGB: 50,
    apiKey: 'cn_live_99a8b7c6d5e4f3a2b10987654321'
  });

  // Modal State
  const [hexViewerFile, setHexViewerFile] = useState(null);
  const [inspectModalFile, setInspectModalFile] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Toast Helper
  const showToast = (title, description, type = 'info') => {
    setToastMessage({ title, description, type, id: Date.now() });
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Derived Stats
  const totalStorageBytes = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);
  const storageCapacityBytes = settings.storageLimitGB * 1024 * 1024 * 1024;
  const storagePercentage = Math.min(100, (totalStorageBytes / storageCapacityBytes) * 100);

  // Render Core Layout
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/90 border border-emerald-500/40 text-slate-100 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-xl animate-bounce-short">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />}
          <div>
            <p className="font-semibold text-sm text-slate-100">{toastMessage.title}</p>
            <p className="text-xs text-slate-400">{toastMessage.description}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-4 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#080d14]">
          {/* Top Bar */}
          <Topbar 
            storagePercentage={storagePercentage} 
            totalStorageBytes={totalStorageBytes}
            storageCapacityBytes={storageCapacityBytes}
            setActiveTab={setActiveTab}
          />

          {/* Dynamic Main Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView 
                files={files} 
                blocks={blocks} 
                totalStorageBytes={totalStorageBytes}
                storageCapacityBytes={storageCapacityBytes}
                setActiveTab={setActiveTab}
                setInspectModalFile={setInspectModalFile}
              />
            )}

            {activeTab === 'objects' && (
              <CloudObjectsView 
                files={files} 
                setFiles={setFiles}
                setHexViewerFile={setHexViewerFile}
                setInspectModalFile={setInspectModalFile}
                showToast={showToast}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'upload' && (
              <UploadView 
                files={files}
                setFiles={setFiles}
                blocks={blocks}
                setBlocks={setBlocks}
                setActivityLogs={setActivityLogs}
                settings={settings}
                showToast={showToast}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'verify' && (
              <DownloadVerifyView 
                files={files} 
                showToast={showToast}
              />
            )}

            {activeTab === 'explorer' && (
              <BlockExplorerView 
                blocks={blocks}
                files={files}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityLogView 
                activityLogs={activityLogs}
              />
            )}

            {activeTab === 'documentation' && (
              <DocumentationView />
            )}

            {activeTab === 'settings' && (
              <SettingsView 
                settings={settings}
                setSettings={setSettings}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>

      {/* Hex Viewer Modal */}
      {hexViewerFile && (
        <HexViewerModal 
          file={hexViewerFile} 
          onClose={() => setHexViewerFile(null)} 
        />
      )}

      {/* Detail Inspection Modal */}
      {inspectModalFile && (
        <FileInspectModal 
          file={inspectModalFile} 
          onClose={() => setInspectModalFile(null)}
          onOpenHex={() => {
            const f = inspectModalFile;
            setInspectModalFile(null);
            setHexViewerFile(f);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// LAYOUT COMPONENTS
// ==========================================

function Sidebar({ activeTab, setActiveTab }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Cpu },
    { id: 'objects', label: 'Cloud Vault Objects', icon: Database },
    { id: 'upload', label: 'Upload & Commit', icon: Upload },
    { id: 'verify', label: 'Verify Hash & Decrypt', icon: ShieldCheck },
    { id: 'explorer', label: 'Block Explorer', icon: Layers },
    { id: 'activity', label: 'Audit Telemetry', icon: Activity },
    { id: 'documentation', label: 'Security Specs', icon: FileCode },
    { id: 'settings', label: 'Vault Settings', icon: Sliders },
  ];

  const handleSelect = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#090e17] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo Header */}
          <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800/60 bg-gradient-to-r from-emerald-950/30 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300 text-lg">
                  CipherNest
                </span>
              </div>
              <p className="text-[10px] tracking-widest uppercase font-mono text-emerald-500/80">
                Zero-Trust Blockchain Vault
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-300 border-l-4 border-emerald-400 font-bold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info badge */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-[11px] font-mono text-slate-300">Node Cluster</p>
                <p className="text-[10px] font-mono text-emerald-400">ONLINE (100% Sync)</p>
              </div>
            </div>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ storagePercentage, totalStorageBytes, storageCapacityBytes, setActiveTab }) {
  return (
    <header className="h-20 border-b border-slate-800/80 bg-[#070b12]/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Network Status Bar */}
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Network:</span>
          <span className="text-emerald-400 font-semibold">Emerald-Mainnet</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Consensus: <strong className="text-slate-200">PoW + Zero-Knowledge Proof</strong></span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Storage Progress Meter */}
        <div className="hidden lg:flex flex-col items-end gap-1 w-44">
          <div className="flex justify-between w-full text-[11px] font-mono">
            <span className="text-slate-400">Vault Capacity</span>
            <span className="text-emerald-400 font-semibold">{storagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full transition-all duration-500" 
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Action Trigger */}
        <button 
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Object</span>
        </button>
      </div>
    </header>
  );
}

// ==========================================
// TAB PAGES
// ==========================================

// 1. DASHBOARD PAGE
function DashboardView({ files, blocks, totalStorageBytes, storageCapacityBytes, setActiveTab, setInspectModalFile }) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 p-6 sm:p-8">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-emerald-400 text-xs font-mono mb-3">
              <Shield className="w-3.5 h-3.5" /> CipherNest Cryptographic Vault v4.2
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Immutable Cloud Ledger & Storage
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              All data is client-side encrypted with AES-256-GCM before commitment to distributed zero-trust ledger consensus nodes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveTab('upload')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950"
            >
              <Lock className="w-4 h-4" /> Encrypt New File
            </button>
            <button 
              onClick={() => setActiveTab('verify')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-5 py-2.5 rounded-xl text-xs border border-slate-700 flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Audit Proof
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Encrypted Vault Objects" 
          value={files.length} 
          sub="100% Hash Verified"
          icon={Database}
          color="emerald"
        />
        <MetricCard 
          title="Total Storage Encrypted" 
          value={formatBytes(totalStorageBytes)} 
          sub={`Limit: ${formatBytes(storageCapacityBytes)}`}
          icon={HardDrive}
          color="amber"
        />
        <MetricCard 
          title="Ledger Height" 
          value={`#${blocks[0]?.height || '1,850,110'}`} 
          sub="Block time ~12s"
          icon={Layers}
          color="teal"
        />
        <MetricCard 
          title="Cryptographic Health" 
          value="100% OK" 
          sub="Zero hash drift detected"
          icon={ShieldCheck}
          color="emerald"
        />
      </div>

      {/* Main Grid: Recent Files & Block Ledger Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vault Objects Overview (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Recent Vault Objects
              </h2>
              <p className="text-xs text-slate-400">Latest files secured with cryptographic proof</p>
            </div>
            <button 
              onClick={() => setActiveTab('objects')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {files.slice(0, 4).map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-all cursor-pointer group"
                onClick={() => setInspectModalFile(file)}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-xs text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-0.5">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span className="text-amber-400">{file.encryptionAlgo}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-block font-mono text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-400">
                    {truncateHash(file.sha256)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Blockchain Telemetry (1 Column) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" /> Active Consensus
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 font-mono text-xs">
                <div className="text-slate-400 mb-1">Latest Block Hash:</div>
                <div className="text-emerald-400 text-[11px] break-all">
                  {blocks[0]?.hash}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Validator Node:</span>
                  <span className="text-slate-200 font-semibold">{blocks[0]?.validator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transactions:</span>
                  <span className="text-amber-400 font-semibold">{blocks[0]?.txCount} committed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Merkle Root:</span>
                  <span className="text-slate-300">{truncateHash(blocks[0]?.merkleRoot)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60">
            <button 
              onClick={() => setActiveTab('explorer')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              <Layers className="w-4 h-4 text-emerald-400" /> Open Ledger Explorer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// 2. CLOUD OBJECTS VIEW
function CloudObjectsView({ files, setFiles, setHexViewerFile, setInspectModalFile, showToast, setActiveTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState('ALL');

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.sha256.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAlgo = selectedAlgo === 'ALL' || f.encryptionAlgo === selectedAlgo;
      return matchesSearch && matchesAlgo;
    });
  }, [files, searchTerm, selectedAlgo]);

  const handleDelete = (id, name) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    showToast('Object Purged', `${name} permanently deleted from vault storage.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" /> Cloud Vault Objects
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse and inspect encrypted binary data stored across distributed ledger nodes.
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('upload')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
        >
          <Upload className="w-4 h-4" /> Add Vault Object
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input 
            type="text" 
            placeholder="Search object name or SHA-256 hash..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <select 
          value={selectedAlgo}
          onChange={(e) => setSelectedAlgo(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Algorithms</option>
          <option value="AES-256-GCM">AES-256-GCM</option>
          <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
        </select>
      </div>

      {/* Files Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="p-4">Vault Object</th>
                <th className="p-4">Encrypted Size</th>
                <th className="p-4">Cryptographic Hash</th>
                <th className="p-4">Block Height</th>
                <th className="p-4">Algorithm</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 font-mono">
                    No matching vault objects found.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <p 
                            className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors cursor-pointer"
                            onClick={() => setInspectModalFile(file)}
                          >
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      {formatBytes(file.size)}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-emerald-400">
                      <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                        {truncateHash(file.sha256, 8, 8)}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-slate-300">
                      #{file.blockHeight}
                    </td>

                    <td className="p-4">
                      <span className="bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded">
                        {file.encryptionAlgo}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setHexViewerFile(file)}
                          title="View Binary Hex Dump"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                        >
                          <Binary className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button 
                          onClick={() => setInspectModalFile(file)}
                          title="Inspect Metadata"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button 
                          onClick={() => handleDelete(file.id, file.name)}
                          title="Purge Object"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 3. UPLOAD & ENCRYPT VIEW
function UploadView({ files, setFiles, blocks, setBlocks, setActivityLogs, settings, showToast, setActiveTab }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [encrypting, setEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [computedHash, setComputedHash] = useState('');
  const [encryptionAlgo, setEncryptionAlgo] = useState(settings.defaultAlgo);
  const [customTag, setCustomTag] = useState('');
  const [tags, setTags] = useState(['Confidential']);

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setEncrypting(true);
    setProgress(20);
    
    // Compute SHA-256 for real selected file
    const hash = await computeSha256(file.name + file.size + Date.now());
    setProgress(70);
    setTimeout(() => {
      setComputedHash(hash);
      setProgress(100);
      setEncrypting(false);
    }, 400);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = () => {
    if (customTag && !tags.includes(customTag)) {
      setTags([...tags, customTag]);
      setCustomTag('');
    }
  };

  const handleCommitToBlockchain = () => {
    if (!selectedFile) return;

    const newBlockHeight = (blocks[0]?.height || 1850110) + 1;
    const newTxHash = '0x' + computedHash.substring(0, 32) + 'a9b8c7d6';

    const newVaultFile = {
      id: `cn-f-${Date.now()}`,
      name: selectedFile.name,
      size: selectedFile.size,
      mimeType: selectedFile.type || 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      sha256: computedHash,
      blockHeight: newBlockHeight,
      txHash: newTxHash,
      status: 'VERIFIED',
      encryptionAlgo: encryptionAlgo,
      tags: tags
    };

    // Update state
    setFiles([newVaultFile, ...files]);

    // Add block ledger entry
    const newBlock = {
      height: newBlockHeight,
      hash: '0x0000000000000000000' + computedHash.substring(0, 40),
      prevHash: blocks[0]?.hash || '0x0000000000000000000789ab9876543210',
      merkleRoot: '0x' + computedHash,
      txCount: 1,
      timestamp: new Date().toISOString(),
      validator: 'Node-Emerald-01',
      sizeKb: Math.round(selectedFile.size / 1024) || 12
    };
    setBlocks([newBlock, ...blocks]);

    // Append log
    setActivityLogs(prev => [
      {
        id: `log-${Date.now()}`,
        action: 'ENCRYPT',
        target: selectedFile.name,
        hash: truncateHash(computedHash, 4, 4),
        timestamp: 'Just now',
        status: 'SUCCESS'
      },
      ...prev
    ]);

    showToast('Vault Commitment Successful', `${selectedFile.name} encrypted and committed to block #${newBlockHeight}.`, 'success');
    setActiveTab('objects');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-emerald-400" /> Upload & Commit Vault Object
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Files are encrypted client-side using WebCrypto primitives before ledger anchoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dropzone Column (2 Cols) */}
        <div className="md:col-span-2 space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[260px]
              ${dragActive ? 'border-emerald-400 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}
            `}
          >
            <input 
              type="file" 
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950">
              <Lock className="w-6 h-6" />
            </div>

            <p className="font-semibold text-sm text-slate-200">
              Drag & Drop your sensitive file here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or click to select from local filesystem
            </p>
            <span className="text-[10px] font-mono text-emerald-400/80 mt-3 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full">
              Zero-Knowledge Client-Side Hash Pipeline
            </span>
          </div>

          {/* Processing / File Selection Details */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-xs text-slate-200">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedFile(null); setComputedHash(''); }}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {encrypting && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Generating SHA-256 Digest...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {computedHash && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                  <span className="text-slate-400 block">Calculated Cryptographic Digest (SHA-256):</span>
                  <span className="text-emerald-400 break-all select-all">{computedHash}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configurations Column (1 Col) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Encryption Options
            </h2>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Encryption Cipher</label>
              <select 
                value={encryptionAlgo}
                onChange={(e) => setEncryptionAlgo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="AES-256-GCM">AES-256-GCM (NIST Standard)</option>
                <option value="ChaCha20-Poly1305">ChaCha20-Poly1305 (Fast Stream)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Vault Metadata Tags</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Add tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handleAddTag}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, idx) => (
                  <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1">
                    #{t}
                    <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-rose-400">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button 
            disabled={!selectedFile || encrypting}
            onClick={handleCommitToBlockchain}
            className={`
              w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg
              ${selectedFile && !encrypting 
                ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 hover:from-emerald-400 hover:to-amber-400 shadow-emerald-950/40 cursor-pointer' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}
            `}
          >
            <ShieldCheck className="w-4 h-4" /> Commit to Distributed Ledger
          </button>
        </div>

      </div>
    </div>
  );
}

// 4. DOWNLOAD & VERIFY VIEW
function DownloadVerifyView({ files, showToast }) {
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleRunAudit = () => {
    if (!verifyInput.trim()) return;
    setVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      const match = files.find(f => 
        f.sha256.toLowerCase() === verifyInput.trim().toLowerCase() ||
        f.name.toLowerCase().includes(verifyInput.trim().toLowerCase())
      );

      setVerifying(false);
      if (match) {
        setVerificationResult({
          status: 'VALID',
          file: match
        });
        showToast('Integrity Confirmed', 'Hash matches active consensus block record.', 'success');
      } else {
        setVerificationResult({
          status: 'INVALID',
          hash: verifyInput
        });
        showToast('Hash Mismatch', 'No matching ledger entry found for this hash signature.', 'error');
      }
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" /> Proof of Integrity & Hash Verification
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Perform zero-knowledge verification against the immutable ledger root hash.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <label className="text-xs font-mono text-slate-300 block">
          Paste Cryptographic SHA-256 Hash or File Name:
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <button 
            disabled={verifying || !verifyInput}
            onClick={handleRunAudit}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950 disabled:bg-slate-800 disabled:text-slate-600"
          >
            {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify Hash Integrity
          </button>
        </div>

        {/* Quick Clickable Sample Hash Chips */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-[11px] font-mono text-slate-500">Sample Vault Hashes:</span>
          {files.slice(0, 2).map(f => (
            <button
              key={f.id}
              onClick={() => setVerifyInput(f.sha256)}
              className="text-[10px] font-mono bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 px-2.5 py-1 rounded"
            >
              {truncateHash(f.sha256, 4, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Results Display */}
      {verificationResult && (
        <div className={`
          rounded-2xl border p-6 backdrop-blur-sm transition-all
          ${verificationResult.status === 'VALID' 
            ? 'bg-emerald-950/20 border-emerald-500/40' 
            : 'bg-rose-950/20 border-rose-500/40'}
        `}>
          {verificationResult.status === 'VALID' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">CRYPTOGRAPHIC PROOF VERIFIED</h3>
                  <p className="text-xs text-slate-400">File match found on active consensus ledger node</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Matched Object:</span>
                  <span className="text-slate-200 font-semibold">{verificationResult.file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Block Anchor Height:</span>
                  <span className="text-emerald-400">#{verificationResult.file.blockHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm Specs:</span>
                  <span className="text-amber-400">{verificationResult.file.encryptionAlgo}</span>
                </div>
                <div className="flex justify-between break-all">
                  <span className="text-slate-500">Verified Hash:</span>
                  <span className="text-emerald-400 text-[11px]">{verificationResult.file.sha256}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => showToast('Simulated Decryption', `Decryption stream initialised for ${verificationResult.file.name}`, 'info')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" /> Decrypt Stream
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-rose-300">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold">INTEGRITY CHECK FAILED</h3>
                <p className="text-xs text-rose-400/80">No block commitment found matching hash: {truncateHash(verificationResult.hash)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 5. BLOCK EXPLORER VIEW
function BlockExplorerView({ blocks, files }) {
  const [expandedBlock, setExpandedBlock] = useState(blocks[0]?.height);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-amber-400" /> Distributed Ledger Explorer
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Inspect real-time blocks, state root commitments, and validator consensus signatures.
        </p>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => {
          const isExpanded = expandedBlock === block.height;
          return (
            <div 
              key={block.height}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm transition-all"
            >
              {/* Block Header Row */}
              <div 
                onClick={() => setExpandedBlock(isExpanded ? null : block.height)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm">
                    #{block.height}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        Block {block.height}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({new Date(block.timestamp).toLocaleTimeString()})
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-emerald-400 mt-0.5">
                      Hash: {truncateHash(block.hash, 12, 12)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="hidden sm:inline-block font-mono text-xs text-slate-400">
                    {block.txCount} txs • {block.sizeKb} KB
                  </span>
                  <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Block Details Expand */}
              {isExpanded && (
                <div className="p-5 bg-slate-950/80 border-t border-slate-800/80 font-mono text-xs space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[10px]">PREVIOUS BLOCK HASH</span>
                      <span className="text-slate-300 break-all">{block.prevHash}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MERKLE STATE ROOT</span>
                      <span className="text-emerald-400 break-all">{block.merkleRoot}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap justify-between text-slate-400 text-[11px]">
                    <span>Validator Node: <strong className="text-slate-200">{block.validator}</strong></span>
                    <span>Consensus Engine: <strong className="text-amber-400">Zero-Knowledge Proof</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 6. ACTIVITY LOG VIEW
function ActivityLogView({ activityLogs }) {
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    if (filter === 'ALL') return activityLogs;
    return activityLogs.filter(l => l.action === filter);
  }, [activityLogs, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" /> Audit Telemetry & Logs
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time cryptographic operation audit trail recorded on-chain.
          </p>
        </div>

        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Event Types</option>
          <option value="ENCRYPT">ENCRYPT</option>
          <option value="DECRYPT">DECRYPT</option>
          <option value="VERIFY">VERIFY</option>
          <option value="KEY_ROTATION">KEY ROTATION</option>
        </select>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="divide-y divide-slate-800/60">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className={`
                  px-2.5 py-1 rounded text-[10px] font-bold tracking-wider
                  ${log.action === 'ENCRYPT' ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400' : ''}
                  ${log.action === 'DECRYPT' ? 'bg-amber-950 border border-amber-500/40 text-amber-400' : ''}
                  ${log.action === 'VERIFY' ? 'bg-teal-950 border border-teal-500/40 text-teal-400' : ''}
                  ${log.action === 'KEY_ROTATION' ? 'bg-purple-950 border border-purple-500/40 text-purple-400' : ''}
                `}>
                  {log.action}
                </span>

                <div>
                  <p className="text-slate-200 font-semibold">{log.target}</p>
                  <p className="text-[10px] text-slate-500">Hash Signature: {log.hash}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">{log.timestamp}</span>
                <span className="text-[10px] text-emerald-400 font-bold">● {log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 7. DOCUMENTATION VIEW
function DocumentationView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCode className="w-6 h-6 text-emerald-400" /> Security Protocol Specifications
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Technical specifications regarding CipherNest zero-trust client architecture.
        </p>
      </div>

      <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Lock className="w-4 h-4 text-emerald-400" /> 1. Client-Side AES-256-GCM Encryption
          </h2>
          <p>
            CipherNest never receives unencrypted binary payloads. Before transmission, data chunks are encrypted locally using WebCrypto 256-bit Galois/Counter Mode keys derived via PBKDF2 with 100,000 iterations.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> 2. Blockchain Hash Anchoring
          </h2>
          <p>
            The SHA-256 state root hash of each file is anchored into a block header committed across decentralized validator nodes. This guarantees immutable proof of integrity and non-repudiation.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Zap className="w-4 h-4 text-teal-400" /> 3. Zero-Knowledge Proof Verification
          </h2>
          <p>
            Users can verify file ownership and unaltered data integrity without revealing the plaintext contents of the file, utilizing zk-SNARK cryptographic proofs validated on-chain.
          </p>
        </div>
      </div>
    </div>
  );
}

// 8. SETTINGS VIEW
function SettingsView({ settings, setSettings, showToast }) {
  const [key, setKey] = useState(settings.apiKey);

  const handleSave = () => {
    setSettings({ ...settings, apiKey: key });
    showToast('Settings Saved', 'Vault operational parameters updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-emerald-400" /> Vault Settings & API
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Manage cipher preferences, node cluster parameters, and access credentials.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 font-mono text-xs">
        <div>
          <label className="text-slate-400 block mb-2">Default Encryption Algorithm</label>
          <select 
            value={settings.defaultAlgo}
            onChange={(e) => setSettings({ ...settings, defaultAlgo: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="AES-256-GCM">AES-256-GCM (Recommended)</option>
            <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-2">Vault Node Cluster Region</label>
          <select 
            value={settings.nodeRegion}
            onChange={(e) => setSettings({ ...settings, nodeRegion: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="us-east-emerald-1">US-East (Emerald Node 01)</option>
            <option value="eu-central-gold-2">EU-Central (Gold Node 02)</option>
            <option value="ap-southeast-amber-3">AP-SouthEast (Amber Node 03)</option>
          </select>
        </div>

        <div>
          <label className="text-slate-400 block mb-2">Vault Access API Key</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={() => showToast('Key Rotated', 'New master API key generated.', 'info')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 rounded-lg font-bold border border-slate-700"
            >
              Rotate
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button 
            onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-950"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL COMPONENTS
// ==========================================

function HexViewerModal({ file, onClose }) {
  const hexDump = useMemo(() => generateHexDump(file.sha256 + file.name, 192), [file]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#090e17] border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Binary className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-mono">
                Hex Dump Inspector: {file.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                SHA-256: {truncateHash(file.sha256, 10, 10)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hex Viewer Body */}
        <div className="p-5 overflow-y-auto font-mono text-xs bg-[#05080f] text-slate-300 space-y-1">
          <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 border-b border-slate-800/80 pb-2 mb-3">
            <span className="col-span-3">ADDRESS</span>
            <span className="col-span-6">HEXADECIMAL DATA</span>
            <span className="col-span-3">ASCII</span>
          </div>

          {hexDump.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 hover:bg-emerald-950/20 py-0.5 rounded px-1">
              <span className="col-span-3 text-slate-500 select-none">{row.address}</span>
              <span className="col-span-6 text-emerald-400">{row.hex}</span>
              <span className="col-span-3 text-amber-300 tracking-wider">{row.ascii}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Offset: 0x00000000 to 0x000000C0</span>
          <button 
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg border border-slate-700 font-bold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

function FileInspectModal({ file, onClose, onOpenHex }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#090e17] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">{file.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 font-mono text-xs space-y-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block text-[10px]">OBJECT SHA-256 DIGEST</span>
            <span className="text-emerald-400 text-[11px] break-all select-all">{file.sha256}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">ENCRYPTED SIZE</span>
              <span>{formatBytes(file.size)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CIPHER ALGORITHM</span>
              <span className="text-amber-400">{file.encryptionAlgo}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">BLOCK HEIGHT</span>
              <span>#{file.blockHeight}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">COMMITMENT DATE</span>
              <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button 
            onClick={onOpenHex}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2"
          >
            <Binary className="w-4 h-4 text-amber-400" /> Inspect Hex Data
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Helper Component
function MetricCard({ title, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl bg-${color}-950/50 border border-${color}-500/30 text-${color}-400`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-xl font-extrabold text-white tracking-tight font-mono">{value}</div>
      <div className="text-[11px] font-mono text-slate-500 mt-1">{sub}</div>
    </div>
  );
}