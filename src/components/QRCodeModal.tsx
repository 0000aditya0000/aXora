import React, { useEffect } from 'react';
import { X, QrCode, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { ShortRoute } from '../types';
import { scanUrl, shortLabel } from '../lib/links';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ShortRoute | null;
  onNotification?: (msg: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  route,
  onNotification,
}) => {
  // Allow Esc key to close the modal instantly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !route) return null;

  const trackedScanUrl = scanUrl(route);
  const activeDestination =
    route.activeRoutingTarget === 'Fallback'
      ? route.fallbackDestination || route.originalDestination
      : route.originalDestination;

  return (
    <div
      onClick={(e) => {
        // Cut / close when clicking on the dimmed backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      {/* Modal Card with Strict Max Height, Flex Column Layout & Sticky Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md my-auto max-h-[92vh] flex flex-col glass-panel-glow border-2 border-orange-500/40 rounded-3xl bg-[#0b0e17] text-slate-100 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* ================= STICKY TOP HEADER (NEVER CUT OFF) ================= */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0 bg-[#0d1220]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase">
                  QR Code
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    route.activeRoutingTarget === 'Fallback'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {route.activeRoutingTarget === 'Fallback' ? 'Web B Active' : 'Web A Active'}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white font-mono tracking-tight truncate mt-0.5" title={route.shortCode}>
                {shortLabel(route)}
              </h2>
            </div>
          </div>

          {/* Dedicated High-Contrast Cut / Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-200 border border-white/15 hover:border-red-500/30 transition text-xs font-mono font-bold cursor-pointer shrink-0 ml-2"
            title="Cut / Close modal (Esc)"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-orange-400 group-hover:text-red-400" />
            <span>Close (✕)</span>
          </button>
        </div>

        {/* ================= SCROLLABLE CONTENT BODY ================= */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Dynamic QR Code Canvas Display with Compact, Responsive Size */}
          <QRCodeDisplay
            url={trackedScanUrl}
            slug={route.shortCode}
            onNotification={onNotification}
            size={160}
            showCustomizer={true}
          />

          {/* Routing Details Card */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Resolves Live To:</span>
              <span
                className={
                  route.activeRoutingTarget === 'Fallback' ? 'text-amber-400' : 'text-emerald-400'
                }
              >
                {route.activeRoutingTarget === 'Fallback' ? 'Website B (Backup)' : 'Website A (Primary)'}
              </span>
            </div>
            <div
              className="text-slate-200 truncate text-[11px] bg-[#121624] px-2.5 py-1.5 rounded-lg border border-white/5 font-mono"
              title={activeDestination}
            >
              {activeDestination}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                1-Link Protection Armed
              </span>
              <span>Scan with phone camera</span>
            </div>
          </div>
        </div>

        {/* ================= STICKY BOTTOM ACTIONS (ALWAYS ACCESSIBLE) ================= */}
        <div className="px-5 py-3 border-t border-white/10 shrink-0 bg-[#0d1220]/95 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white">Esc</kbd> or click outside to cut
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-mono font-bold transition cursor-pointer shadow-lg ml-auto"
          >
            Done / Close (✕)
          </button>
        </div>
      </div>
    </div>
  );
};
