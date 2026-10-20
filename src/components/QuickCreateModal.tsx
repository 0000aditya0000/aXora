import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Zap,
  Sparkles,
  Youtube,
  Globe,
  Link2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Scissors,
  Share2,
} from 'lucide-react';
import { ShortRoute } from '../types';
import { clickUrl, shortLabel, shortPrefix } from '../lib/links';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (route: Partial<ShortRoute>) => void | Promise<ShortRoute | null>;
  onNotification: (msg: string) => void;
  onOpenQrModal?: (route: ShortRoute) => void;
}

// Generate unambiguous 4-char slug so ax.to/xxxx is exactly 10 characters!
const generateShortCode = (len = 4): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSaveRoute,
  onNotification,
  onOpenQrModal,
}) => {
  // Mode selection: 'instant10' (Primary 10-char shortener) vs 'failover' (Dual-target advanced)
  const [activeTab, setActiveTab] = useState<'instant10' | 'failover'>('instant10');

  // Input States
  const [targetUrl, setTargetUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [copied, setCopied] = useState(false);
  const [includeProtocolInCopy, setIncludeProtocolInCopy] = useState(false);

  // Advanced / Failover options
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [failoverEnabled, setFailoverEnabled] = useState(false);
  const [campaign, setCampaign] = useState('Q3 Global Growth');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Initialize random short code when modal opens
  useEffect(() => {
    if (isOpen && !customAlias) {
      setCustomAlias(generateShortCode(4));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute clean code and URLs
  const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'link';
  const shortUrlDisplay = shortLabel(cleanAlias);
  const fullShortUrl = clickUrl(cleanAlias);
  const inputCharCount = targetUrl.trim().length;
  const shortCharCount = shortUrlDisplay.length; // e.g. "ax.to/k9x2" = 10 chars!

  // YouTube and sample presets for instant testing
  const samplePresets = [
    {
      label: 'YouTube Video',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      icon: Youtube,
      chars: 43,
    },
    {
      label: 'YouTube Shorts',
      url: 'https://youtube.com/shorts/5qap5aO4i9A',
      icon: Youtube,
      chars: 38,
    },
    {
      label: 'Long Webpage',
      url: 'https://axora.io/solutions/enterprise-global-edge-routing-failover',
      icon: Globe,
      chars: 64,
    },
  ];

  const handleApplyPreset = (url: string) => {
    setTargetUrl(url);
    if (!customAlias) {
      setCustomAlias(generateShortCode(4));
    }
  };

  const handleRandomizeCode = () => {
    const newCode = generateShortCode(4);
    setCustomAlias(newCode);
    setCopied(false);
  };

  const handleCopyDirectly = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!targetUrl.trim()) {
      onNotification('⚠️ Please enter a destination link (e.g. YouTube URL) first');
      return;
    }

    const textToCopy = includeProtocolInCopy ? fullShortUrl : shortUrlDisplay;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onNotification(`✓ Copied ${textToCopy} to clipboard! (10-char short link)`);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      onNotification(`✓ Copied ${textToCopy} to clipboard!`);
      setTimeout(() => setCopied(false), 3000);
    }

    // Also auto-save to platform routes so user can track and use it
    deployRouteRecord(false);
  };

  const deployRouteRecord = async (closeAfterDeploy = true): Promise<ShortRoute | null> => {
    const formattedTarget = targetUrl.trim().startsWith('http')
      ? targetUrl.trim()
      : `https://${targetUrl.trim()}`;

    const newRouteData: Partial<ShortRoute> = {
      shortCode: cleanAlias,
      originalDestination: formattedTarget,
      fallbackDestination:
        failoverEnabled && fallbackUrl.trim()
          ? fallbackUrl.trim().startsWith('http')
            ? fallbackUrl.trim()
            : `https://${fallbackUrl.trim()}`
          : undefined,
      failoverEnabled,
      maxLatencyThreshold: 2000,
      trafficRateCap: 500,
      httpFailoverCodes: ['500', '502', '503', '504', '429'],
      activeRoutingTarget: 'Primary',
      healthStatus: 'Healthy',
      currentLatencyMs: 85,
      currentTrafficRate: 0,
      campaign,
      clicks: 0,
      uniqueVisitors: 0,
      ctr: 0,
      edgeStatus: 'Active',
      tags: targetUrl.includes('youtube') ? ['#youtube', '#video'] : ['#short-link'],
      passcodeEnabled: false,
      clickThreshold: 10000,
      ttl: '30d',
    };

    const saved = await onSaveRoute(newRouteData);
    if (!saved) return null;

    if (closeAfterDeploy) {
      onNotification(`Created ${shortLabel(saved)}`);
      onClose();
    }

    return saved;
  };

  const handleDeployAndOpenQr = async () => {
    if (!targetUrl.trim()) {
      onNotification('⚠️ Please enter a destination URL first');
      return;
    }
    const route = await deployRouteRecord(false);
    if (!route) return;
    onClose();
    if (onOpenQrModal) onOpenQrModal(route);
  };

  const handleTestDestination = () => {
    if (!targetUrl.trim()) {
      onNotification('⚠️ Please enter a destination URL first');
      return;
    }
    const formatted = targetUrl.trim().startsWith('http')
      ? targetUrl.trim()
      : `https://${targetUrl.trim()}`;
    window.open(formatted, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="glass-panel-glow w-full max-w-xl rounded-3xl p-5 sm:p-7 relative border border-orange-500/40 text-left max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight">
              Create Short Link
            </h3>
          </div>
          <span className="ml-auto mr-8 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            10-Char Engine
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
          Put any link (e.g. YouTube, news, web pages) to compress it down to a sleek 10-character link you can copy directly in one click.
        </p>

        {/* Primary Feature Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#090d16] border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('instant10')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'instant10'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Instant 10-Char Shortener</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('failover')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'failover'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-200" />
            <span>🛡️ Auto-Failover (Web A+B)</span>
          </button>
        </div>

        {/* PRIMARY FEATURE SECTION: PUT ANY LINK & MAKE IT 10 CHARS */}
        <div className="space-y-4">
          {/* 1. Main URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Put Any Link (e.g., YouTube URL)</span>
                <span className="text-orange-400">*</span>
              </label>
              {inputCharCount > 0 && (
                <span className="text-[11px] font-mono text-slate-400">
                  Length: <span className="text-white font-semibold">{inputCharCount} chars</span>
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setCopied(false);
                }}
                placeholder="Paste any link: https://youtube.com/watch?v=..."
                className="w-full bg-[#090d16] border border-white/15 focus:border-orange-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono outline-none shadow-inner pr-24"
              />
              {/* Quick Paste from clipboard button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setTargetUrl(text);
                      onNotification('Pasted link from clipboard!');
                    }
                  } catch {
                    onNotification('Please paste your link directly into the box');
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-mono font-medium transition cursor-pointer"
              >
                Paste
              </button>
            </div>

            {/* Quick 1-Click Samples for YouTube and Web Links */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Try sample:</span>
              {samplePresets.map((preset, idx) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.url)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e1424] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 text-[11px] font-mono text-slate-300 hover:text-orange-300 transition cursor-pointer"
                  >
                    <Icon className="w-3 h-3 text-red-400" />
                    <span>{preset.label}</span>
                    <span className="text-slate-500 text-[10px]">({preset.chars}ch)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Character Length Reduction Visualizer */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/30 via-[#0e1424] to-[#0a0f1d] border border-orange-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                10ch
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Sleek 10-Character Output</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                    ✓ Verified
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {inputCharCount > 0 ? (
                    <>
                      <span className="text-slate-300">{inputCharCount} chars</span>
                      <ArrowRight className="w-3 h-3 inline mx-1 text-orange-400" />
                      <span className="text-emerald-400 font-bold">{shortCharCount} chars ({shortUrlDisplay})</span>
                      <span className="ml-1.5 text-orange-300 font-semibold">
                        ({Math.round(((inputCharCount - shortCharCount) / inputCharCount) * 100)}% shorter)
                      </span>
                    </>
                  ) : (
                    'Paste any link to reduce 20-100+ characters down to 10 characters'
                  )}
                </div>
              </div>
            </div>

            {/* Domain & Code Settings */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-orange-500 text-white shadow">
                Live · clicks & QR scans tracked
              </span>
            </div>
          </div>

          {/* 3. PRIMARY HIGHLIGHT BOX: THE 10-CHAR SHORT LINK & DIRECT 1-CLICK COPY BUTTON */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#090d18] border-2 border-orange-500/50 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span className="text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Shortened Link Ready To Copy
              </span>
              <span className="text-emerald-400 font-semibold">
                Exact Length: {shortCharCount} characters
              </span>
            </div>

            {/* Display Box with Direct Copy Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 bg-[#121624] border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-baseline gap-1 font-mono text-sm sm:text-base font-bold text-white">
                  <span className="text-orange-400 break-all">{shortUrlDisplay}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRandomizeCode}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Generate new 4-character code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* PRIMARY ACTION: DIRECT COPY BUTTON */}
              <button
                type="button"
                onClick={handleCopyDirectly}
                className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'glow-orange-btn text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✓ Copied Directly!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Short Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary Controls below output */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeProtocolInCopy}
                  onChange={(e) => setIncludeProtocolInCopy(e.target.checked)}
                  className="accent-orange-500 rounded cursor-pointer"
                />
                <span>Include https:// in copy</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestDestination}
                  className="text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span>Test Original</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeployAndOpenQr}
                  className="text-[11px] font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Get QR Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Optional Custom Alias & Code Settings */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-semibold uppercase text-slate-300">
                Custom Short Code / Alias (4 chars for 10-char link)
              </label>
              <button
                type="button"
                onClick={handleRandomizeCode}
                className="text-[10px] font-mono text-orange-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Randomize
              </button>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-white/15 focus-within:border-orange-500 bg-[#090d16]">
              <span className="px-3 py-2 bg-[#0c101d] text-slate-400 text-xs font-mono border-r border-white/10 select-none flex items-center">
                {shortPrefix()}
              </span>
              <input
                type="text"
                value={customAlias}
                maxLength={20}
                onChange={(e) => {
                  setCustomAlias(e.target.value);
                  setCopied(false);
                }}
                placeholder="yt7k"
                className="w-full bg-transparent px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* 5. Auto-Failover Backup URL (Website B) - Available in both tabs */}
          {(activeTab === 'failover' || showAdvancedOptions) && (
            <div className="p-3.5 rounded-2xl bg-[#090d16] border border-white/10 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Automatic Failover (Website B Backup)
                </span>
                <button
                  type="button"
                  onClick={() => setFailoverEnabled(!failoverEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    failoverEnabled ? 'bg-orange-500' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle failover"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      failoverEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {failoverEnabled && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Fallback Mirror URL (Website B)
                  </label>
                  <input
                    type="url"
                    value={fallbackUrl}
                    onChange={(e) => setFallbackUrl(e.target.value)}
                    placeholder="https://backup-server.com/mirror-destination"
                    className="w-full bg-[#121624] border border-white/15 focus:border-orange-500 rounded-lg px-3 py-2 text-xs text-amber-200 outline-none font-mono placeholder-slate-600"
                  />
                  <p className="text-[10px] text-slate-400">
                    If Website A goes down (5xx errors or &gt;2000ms latency), the same short link instantly redirects to this Website B backup.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instant10' && !showAdvancedOptions && (
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(true)}
              className="text-[11px] font-mono text-slate-400 hover:text-orange-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>+ Add Failover Backup (Website B) or Campaign Tag</span>
            </button>
          )}

          {/* Campaign Selector if advanced is opened */}
          {showAdvancedOptions && (
            <div className="animate-in fade-in space-y-1">
              <label className="block text-[11px] font-mono font-semibold uppercase text-slate-300">
                Campaign / Workspace
              </label>
              <select
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                className="w-full bg-[#090d16] border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none font-sans cursor-pointer"
              >
                <option>Q3 Global Growth</option>
                <option>YouTube & Social Outreach</option>
                <option>Product Launch 2026</option>
                <option>Partner Referral Direct</option>
                <option>Internal Executive Memos</option>
              </select>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 cursor-pointer text-center"
            >
              Close
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDeployAndOpenQr}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1.5 cursor-pointer transition"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-400" />
                <span>QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => deployRouteRecord(true)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white glow-orange-btn flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
