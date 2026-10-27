import React, { useState, useMemo } from 'react';
import { Copy, Check, Eye, ShieldAlert } from 'lucide-react';
import { formatHexViewer, bufferToHex } from '../../services/crypto';
import { useToast } from '../../context/ToastContext';

interface HexViewerProps {
  data: ArrayBuffer;
  blockIndex: number;
  objectKey: string;
  blockHash: string;
}

export const HexViewer: React.FC<HexViewerProps> = ({
  data,
  blockIndex,
  objectKey,
  blockHash,
}) => {
  const { showToast } = useToast();
  const [maxBytes, setMaxBytes] = useState<number>(512); // Default to first 512 bytes for snappy rendering
  const [copied, setCopied] = useState<boolean>(false);

  const { lines, totalBytes, isTruncated } = useMemo(() => {
    return formatHexViewer(data, 16, maxBytes === 0 ? undefined : maxBytes);
  }, [data, maxBytes]);

  const first16Hex = useMemo(() => {
    const preview = data.slice(0, Math.min(16, data.byteLength));
    return bufferToHex(preview);
  }, [data]);

  const last16Hex = useMemo(() => {
    const len = data.byteLength;
    const preview = data.slice(Math.max(0, len - 16), len);
    return bufferToHex(preview);
  }, [data]);

  const handleCopyHex = () => {
    const fullHex = bufferToHex(data);
    navigator.clipboard.writeText(fullHex);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'Ciphertext Copied',
      message: `Copied ${totalBytes.toLocaleString()} bytes of hex ciphertext to clipboard.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">
            Encrypted Block #{blockIndex}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{objectKey}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>View Limit:</span>
            <select
              value={maxBytes}
              onChange={(e) => setMaxBytes(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value={256}>256 Bytes</option>
              <option value={512}>512 Bytes</option>
              <option value={1024}>1 KiB</option>
              <option value={4096}>4 KiB</option>
              <option value={0}>All ({totalBytes.toLocaleString()} B)</option>
            </select>
          </div>

          <button
            onClick={handleCopyHex}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
            title="Copy entire block ciphertext in hex"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? 'Copied' : 'Copy Hex'}</span>
          </button>
        </div>
      </div>

      {/* Ciphertext Security Banner */}
      <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-400/90">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>AES-256-GCM Ciphertext — Cryptographically indistinguishable from random noise</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <div>
            Size: <span className="text-slate-200 font-semibold">{totalBytes.toLocaleString()} B</span>
          </div>
          <div>
            SHA-256:{' '}
            <span className="text-slate-200 font-semibold" title={blockHash}>
              {blockHash.slice(0, 8)}...{blockHash.slice(-8)}
            </span>
          </div>
        </div>
      </div>

      {/* Previews: First and Last 16 Bytes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-900/60 border-b border-slate-800 text-[11px]">
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
            First 16 Bytes (Hex):
          </span>
          <span className="text-blue-400 select-all break-all">{first16Hex}</span>
        </div>
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider">
            Last 16 Bytes (Includes GCM Tag):
          </span>
          <span className="text-purple-400 select-all break-all">{last16Hex}</span>
        </div>
      </div>

      {/* Hex Dump Table */}
      <div className="p-4 overflow-x-auto max-h-96 select-text">
        <div className="min-w-[620px]">
          {/* Column Header */}
          <div className="flex text-slate-500 text-[11px] pb-2 border-b border-slate-800 font-semibold tracking-wider">
            <div className="w-20">OFFSET</div>
            <div className="flex-1 grid grid-cols-16 gap-1 px-4 text-center">
              <span>00</span>
              <span>01</span>
              <span>02</span>
              <span>03</span>
              <span>04</span>
              <span>05</span>
              <span>06</span>
              <span>07</span>
              <span>08</span>
              <span>09</span>
              <span>0A</span>
              <span>0B</span>
              <span>0C</span>
              <span>0D</span>
              <span>0E</span>
              <span>0F</span>
            </div>
            <div className="w-40 px-2">ASCII DUMP</div>
          </div>

          {/* Hex Lines */}
          <div className="divide-y divide-slate-800/30 pt-1">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center py-0.5 hover:bg-slate-800/40 font-mono text-[11px]"
              >
                <div className="w-20 text-slate-500 select-none">{line.offset}</div>
                <div className="flex-1 grid grid-cols-16 gap-1 px-4 text-center">
                  {line.hexParts.map((hex, byteIdx) => (
                    <span
                      key={byteIdx}
                      className={
                        hex.trim()
                          ? byteIdx >= 8
                            ? 'text-indigo-300'
                            : 'text-slate-300'
                          : 'text-slate-700'
                      }
                    >
                      {hex}
                    </span>
                  ))}
                </div>
                <div className="w-40 px-2 text-emerald-400/80 truncate tracking-widest select-none">
                  {line.ascii}
                </div>
              </div>
            ))}
          </div>

          {isTruncated && (
            <div className="text-center py-3 border-t border-slate-800 mt-2 text-slate-400 text-xs flex items-center justify-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Showing first {lines.length * 16} bytes of {totalBytes.toLocaleString()}{' '}
                bytes. Adjust "View Limit" above to see more.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
