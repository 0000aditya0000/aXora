import React, { useState } from 'react';
import { ViewMode, ShortRoute } from '../types';
import { clickUrl, shortLabel, shortPrefix } from '../lib/links';
import Hero from '../../components/ui/animated-shader-hero';
import {
  TrendingUp,
  Link2,
  Copy,
  Plus,
  ArrowRight,
  ExternalLink,
  Zap,
  QrCode,
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FolderKanban,
  Youtube,
  Globe,
  Scissors,
} from 'lucide-react';

interface OverviewViewProps {
  onSwitchView: (view: ViewMode) => void;
  onOpenCreateModal: () => void;
  onInspectThreat: () => void;
  onCopyLink: (text: string) => void;
  routes: ShortRoute[];
  onOpenFailoverSimulator?: (route: ShortRoute) => void;
  onOpenQrModal?: (route: ShortRoute) => void;
  onSaveRoute?: (route: Partial<ShortRoute>) => void | Promise<ShortRoute | null>;
  onNotification?: (msg: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSwitchView,
  onOpenCreateModal,
  onInspectThreat,
  onCopyLink,
  routes,
  onOpenFailoverSimulator,
  onOpenQrModal,
  onSaveRoute,
  onNotification,
}) => {
  const [headlineMode, setHeadlineMode] = useState<'orbit' | 'axora'>('orbit');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Feature: Instant 10-Character Shortener & Failover Switch
  const [shortenerMode, setShortenerMode] = useState<'instant10' | 'failover'>('instant10');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('yt8k');
  const [failoverEnabled, setFailoverEnabled] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [campaign, setCampaign] = useState('Q3 Global Growth');
  const [copiedDirectly, setCopiedDirectly] = useState(false);
  const [includeProtocol, setIncludeProtocol] = useState(false);
  const [showAdvancedInHub, setShowAdvancedInHub] = useState(false);

  // Recently created link for instant feedback
  const [recentlyCreatedRoute, setRecentlyCreatedRoute] = useState<ShortRoute | null>(null);

  // Unambiguous 4-char code generation
  const generateCode = (len = 4) => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

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
    setPrimaryUrl(url);
    if (!customAlias || customAlias === 'summer-vip') {
      setCustomAlias(generateCode(4));
    }
  };

  const handleRandomizeHubCode = () => {
    setCustomAlias(generateCode(4));
    setCopiedDirectly(false);
  };

  const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'link';
  const hubShortDisplay = shortLabel(cleanAlias);
  const hubFullShortUrl = clickUrl(cleanAlias);
  const inputCharCount = primaryUrl.trim().length;
  const shortCharCount = hubShortDisplay.length;

  const handleDirectCopyInHub = async () => {
    if (!primaryUrl.trim()) {
      onNotification?.('⚠️ Please put any link (e.g. YouTube URL) first');
      return;
    }

    const textToCopy = includeProtocol ? hubFullShortUrl : hubShortDisplay;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedDirectly(true);
      onNotification?.(`✓ Copied ${textToCopy} directly to clipboard! (10-char short link)`);
      setTimeout(() => setCopiedDirectly(false), 3000);
    } catch {
      onCopyLink(textToCopy);
      setCopiedDirectly(true);
      setTimeout(() => setCopiedDirectly(false), 3000);
    }

    // Auto-save route
    handleQuickShortenSubmit();
  };

  const scrollToShortener = () => {
    const el = document.getElementById('shortener-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickShortenSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!primaryUrl.trim()) {
      onNotification?.('Please enter a destination URL (Website A)');
      return;
    }

    const formattedPrimary = primaryUrl.trim().startsWith('http')
      ? primaryUrl.trim()
      : `https://${primaryUrl.trim()}`;

    const formattedFallback =
      failoverEnabled && fallbackUrl.trim()
        ? fallbackUrl.trim().startsWith('http')
          ? fallbackUrl.trim()
          : `https://${fallbackUrl.trim()}`
        : undefined;

    const newRoute: Partial<ShortRoute> = {
      shortCode: cleanAlias,
      originalDestination: formattedPrimary,
      fallbackDestination: formattedFallback,
      failoverEnabled,
      maxLatencyThreshold: 2000,
      trafficRateCap: 500,
      httpFailoverCodes: ['500', '502', '503', '504', '429'],
      activeRoutingTarget: 'Primary',
      healthStatus: 'Healthy',
      currentLatencyMs: 115,
      currentTrafficRate: 0,
      campaign,
      clicks: 0,
      uniqueVisitors: 0,
      ctr: 0,
      edgeStatus: 'Active',
      tags: primaryUrl.includes('youtube') ? ['#youtube', '#video'] : ['#quick-shortener'],
      passcodeEnabled: false,
      clickThreshold: 10000,
      ttl: '30d',
    };

    const saved = onSaveRoute ? await onSaveRoute(newRoute) : null;
    if (onSaveRoute && !saved) return;

    const mockFullRoute: ShortRoute = {
      id: `lnk_${Date.now()}`,
      shortCode: cleanAlias,
      originalDestination: formattedPrimary,
      fallbackDestination: formattedFallback,
      failoverEnabled,
      creator: 'aXora',
      clicks: 0,
      uniqueVisitors: 0,
      ctr: 0,
      edgeStatus: 'Active',
      campaign,
      tags: primaryUrl.includes('youtube') ? ['#youtube', '#video'] : ['#quick-shortener'],
      passcodeEnabled: false,
      clickThreshold: 10000,
      ttl: '30d',
      activeRoutingTarget: 'Primary',
      healthStatus: 'Healthy',
      createdAt: new Date().toISOString(),
    };

    setRecentlyCreatedRoute(saved || mockFullRoute);
    onNotification?.(`Short link ${shortLabel(saved || mockFullRoute)} is ready to share.`);
  };

  const filteredRoutes = routes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.shortCode.toLowerCase().includes(q) ||
      r.originalDestination.toLowerCase().includes(q) ||
      (r.fallbackDestination && r.fallbackDestination.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full">
      {/* ================= FULL SCREEN ANIMATED WEBGL SHADER HERO ================= */}
      <Hero
        trustBadge={{
          text:
            headlineMode === 'orbit'
              ? 'Trusted by forward-thinking teams.'
              : 'Trusted by enterprise growth & operations teams',
          icons: ['✨'],
        }}
        headline={
          headlineMode === 'orbit'
            ? { line1: 'Launch Your', line2: 'Workflow Into Orbit' }
            : { line1: 'aXora', line2: 'Link Intelligence Platform' }
        }
        subtitle={
          headlineMode === 'orbit'
            ? 'Supercharge productivity with aXora built for the next generation of teams — fast, seamless, and limitless.'
            : 'Shorten links, generate instant scannable QR codes, and protect your destination with automatic edge failover.'
        }
        buttons={{
          primary: {
            text: 'Shorten Link',
            onClick: scrollToShortener,
          },
          secondary: {
            text: 'QR Code Generator',
            onClick: () => onSwitchView('qr'),
          },
        }}
        className="min-h-[85vh] sm:min-h-screen"
      >
        {/* Telemetry Strip & Quick Switch */}
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
          {/* Subtle mode switcher pill */}
          <div className="inline-flex items-center p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs">
            <button
              onClick={() => setHeadlineMode('orbit')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                headlineMode === 'orbit'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Workflow Orbit
            </button>
            <button
              onClick={() => setHeadlineMode('axora')}
              className={`px-3 py-1 rounded-full transition cursor-pointer ${
                headlineMode === 'axora'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              aXora Intelligence
            </button>
          </div>

          {/* Quick Platform Telemetry Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full text-left">
            <div className="p-3 rounded-xl glass-panel border border-white/10 flex items-center gap-3 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Global Ping
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">18ms Anycast</div>
              </div>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/10 flex items-center gap-3 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  QR Engine
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">Instant Vector & PNG</div>
              </div>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/10 flex items-center gap-3 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Auto-Failover
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">1-Link Protection</div>
              </div>
            </div>
            <div className="p-3 rounded-xl glass-panel border border-white/10 flex items-center gap-3 backdrop-blur-md">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Uptime SLA
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">99.999% Guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </Hero>

      {/* ================= SECTION 2: SIMPLIFIED WORKSPACE & SHORTENER ================= */}
      <section id="workspace-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation Quick Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Simple &amp; Fast URL Shortener
              </h2>
              <p className="text-xs text-slate-400">
                Create shortened links, get dynamic QR codes, and enable 1-link failover.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchView('qr')}
              className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code Studio</span>
            </button>
            <button
              onClick={() => onSwitchView('campaigns')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 text-slate-400" />
              <span>All Links ({routes.length})</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN SHORTENER CARD (PRIMARY 10-CHAR SHORTENER) ================= */}
        <div
          id="shortener-card"
          className="glass-panel-glow p-6 sm:p-8 rounded-3xl border border-orange-500/35 shadow-2xl relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Scissors className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold text-white font-sans">Quick Shortlink Creator</h3>
            </div>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              10-Char Primary Engine
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 mb-5 max-w-2xl font-sans">
            Put any link (e.g. YouTube video, article, social post) to compress it down to a 10-character link and copy it directly in 1 click.
          </p>

          {/* Primary Feature Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#090d16] border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => setShortenerMode('instant10')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                shortenerMode === 'instant10'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Instant 10-Char Shortener</span>
            </button>
            <button
              type="button"
              onClick={() => setShortenerMode('failover')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                shortenerMode === 'failover'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>🛡️ Auto-Failover (Web A+B)</span>
            </button>
          </div>

          <form onSubmit={handleQuickShortenSubmit} className="space-y-4">
            {/* 1. Put Any Link (Primary Input) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Put Any Link (e.g. YouTube URL)</span>
                  <span className="text-orange-400">*</span>
                </label>
                {inputCharCount > 0 && (
                  <span className="text-[11px] font-mono text-slate-400">
                    Input: <span className="text-white font-semibold">{inputCharCount} chars</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="url"
                  required
                  value={primaryUrl}
                  onChange={(e) => {
                    setPrimaryUrl(e.target.value);
                    setCopiedDirectly(false);
                  }}
                  placeholder="Paste any link: https://youtube.com/watch?v=..."
                  className="w-full bg-[#090d16] border border-white/15 focus:border-orange-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono outline-none shadow-inner pr-24"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setPrimaryUrl(text);
                        onNotification?.('Pasted link from clipboard!');
                      }
                    } catch {
                      onNotification?.('Please paste your link directly into the box');
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-mono font-medium transition cursor-pointer"
                >
                  Paste
                </button>
              </div>

              {/* Sample Presets for YouTube and Web Links */}
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
                      ✓ Target
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {inputCharCount > 0 ? (
                      <>
                        <span className="text-slate-300">{inputCharCount} chars</span>
                        <ArrowRight className="w-3 h-3 inline mx-1 text-orange-400" />
                        <span className="text-emerald-400 font-bold">{shortCharCount} chars ({hubShortDisplay})</span>
                        <span className="ml-1.5 text-orange-300 font-semibold">
                          ({Math.round(((inputCharCount - shortCharCount) / inputCharCount) * 100)}% reduction)
                        </span>
                      </>
                    ) : (
                      'Paste any link to reduce 20-80+ characters down to 10 characters'
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
                  Shortened Link Ready To Copy Directly
                </span>
                <span className="text-emerald-400 font-semibold">
                  Exact Length: {shortCharCount} characters
                </span>
              </div>

              {/* Display Box with Direct Copy Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 bg-[#121624] border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-1 font-mono text-sm sm:text-base font-bold text-white">
                    <span className="text-orange-400 break-all">{hubShortDisplay}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomizeHubCode}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Generate new 4-character code"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* PRIMARY ACTION: DIRECT COPY BUTTON */}
                <button
                  type="button"
                  onClick={handleDirectCopyInHub}
                  className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 shrink-0 ${
                    copiedDirectly
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                      : 'glow-orange-btn text-white'
                  }`}
                >
                  {copiedDirectly ? (
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
                    checked={includeProtocol}
                    onChange={(e) => setIncludeProtocol(e.target.checked)}
                    className="accent-orange-500 rounded cursor-pointer"
                  />
                  <span>Include https:// in copy</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!primaryUrl.trim()) {
                        onNotification?.('Please put a destination URL first');
                        return;
                      }
                      const formatted = primaryUrl.trim().startsWith('http')
                        ? primaryUrl.trim()
                        : `https://${primaryUrl.trim()}`;
                      window.open(formatted, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                    <span>Test Destination</span>
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!primaryUrl.trim()) {
                        onNotification?.('Please put a destination URL first');
                        return;
                      }
                      handleQuickShortenSubmit();
                      if (onOpenQrModal) {
                        onOpenQrModal({
                          id: `lnk_${Date.now()}`,
                          shortCode: cleanAlias,
                          originalDestination: primaryUrl,
                          creator: 'aXora',
                          clicks: 0,
                          uniqueVisitors: 0,
                          ctr: 0,
                          edgeStatus: 'Active',
                          campaign,
                          tags: ['#quick-link'],
                          passcodeEnabled: false,
                          clickThreshold: 10000,
                          ttl: '30d',
                          createdAt: new Date().toISOString(),
                        });
                      }
                    }}
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
                  onClick={handleRandomizeHubCode}
                  className="text-[10px] font-mono text-orange-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Randomize
                </button>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-white/15 focus-within:border-orange-500 bg-[#090d16]">
                <span className="px-3.5 py-2.5 bg-[#0c101d] text-slate-400 text-xs font-mono border-r border-white/10 select-none flex items-center">
                  {shortPrefix()}
                </span>
                <input
                  type="text"
                  value={customAlias}
                  maxLength={20}
                  onChange={(e) => {
                    setCustomAlias(e.target.value);
                    setCopiedDirectly(false);
                  }}
                  placeholder="yt8k"
                  className="w-full bg-transparent px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* 5. Auto-Failover Section */}
            {(shortenerMode === 'failover' || showAdvancedInHub) && (
              <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    Automatic Failover Protection (Website B)
                  </span>
                  <button
                    type="button"
                    onClick={() => setFailoverEnabled(!failoverEnabled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      failoverEnabled ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                    aria-label="Toggle failover protection"
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        failoverEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {failoverEnabled && (
                  <div className="pt-2 animate-in fade-in duration-200 space-y-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Fallback URL (Backup for Downtime / High Traffic)
                    </label>
                    <input
                      type="url"
                      value={fallbackUrl}
                      onChange={(e) => setFallbackUrl(e.target.value)}
                      placeholder="https://backup.example.com/mirror-landing"
                      className="w-full bg-[#121624] border border-white/15 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 outline-none font-mono placeholder-slate-600 shadow-inner"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Auto-redirects if Website A returns 5xx/429, times out &gt;2000ms, or exceeds 500 cpm.
                    </p>
                  </div>
                )}
              </div>
            )}

            {shortenerMode === 'instant10' && !showAdvancedInHub && (
              <button
                type="button"
                onClick={() => setShowAdvancedInHub(true)}
                className="text-[11px] font-mono text-slate-400 hover:text-orange-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>+ Add Failover Backup (Website B) or Campaign Tag</span>
              </button>
            )}

            {/* Campaign Selector if advanced is opened */}
            {showAdvancedInHub && (
              <div className="animate-in fade-in space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Campaign
                </label>
                <select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  className="w-full bg-[#090d16] border border-white/15 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-sans outline-none cursor-pointer"
                >
                  <option value="Q3 Global Growth">Q3 Global Growth</option>
                  <option value="YouTube & Social Outreach">YouTube & Social Outreach</option>
                  <option value="Product Launch 2026">Product Launch 2026</option>
                  <option value="Developer Summit">Developer Summit</option>
                  <option value="Social Outreach">Social Outreach</option>
                </select>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
              <span className="text-xs text-slate-500 font-mono">
                ⚡ Automatically registered on edge with instant QR code
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto glow-orange-btn px-6 py-3 rounded-xl text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Save Link &amp; Get QR Code</span>
              </button>
            </div>
          </form>

          {/* ================= INSTANT CREATION SUCCESS BANNER ================= */}
          {recentlyCreatedRoute && (
            <div className="mt-6 p-5 rounded-2xl bg-[#091512] border border-emerald-500/40 text-emerald-100 animate-in fade-in slide-in-from-top-3 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      Shortlink Published!
                    </span>
                    <span className="text-sm font-mono text-white font-bold">
                      {shortLabel(recentlyCreatedRoute)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onCopyLink(clickUrl(recentlyCreatedRoute))}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={() => onOpenQrModal && onOpenQrModal(recentlyCreatedRoute)}
                    className="px-3.5 py-1.5 rounded-lg glow-orange-btn text-white text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Code</span>
                  </button>
                  {onOpenFailoverSimulator && (
                    <button
                      onClick={() => onOpenFailoverSimulator(recentlyCreatedRoute)}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Test Failover</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300 pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-emerald-400 mr-1.5 font-bold">Origin (A):</span>
                  <span>{recentlyCreatedRoute.originalDestination}</span>
                </div>
                {recentlyCreatedRoute.fallbackDestination && (
                  <div className="truncate text-amber-300">
                    <span className="font-bold mr-1.5">Backup (B):</span>
                    <span>{recentlyCreatedRoute.fallbackDestination}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= 1-LINK FAILOVER ARCHITECTURE CALLOUT ================= */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-[#0e1424] to-[#0a0e1a] border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">Single-Link Failover Engine</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  1 Link ➔ 2 Destinations
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Both Website A and Backup Website B live behind <strong>1 link</strong>. If Website A encounters 5xx downtime or &gt;2000ms latency, visitors seamlessly redirect to Website B.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSwitchView('qr')}
              className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 font-mono text-xs border border-orange-500/30 transition cursor-pointer flex items-center gap-1 font-semibold"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Studio</span>
            </button>
            <button
              onClick={() => onSwitchView('analytics')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs border border-white/10 transition cursor-pointer flex items-center gap-1"
            >
              <span>Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= RECENT LINKS TABLE (CLEAN & EASY TO USE) ================= */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Active Short Links</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono">
                  {filteredRoutes.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any link or QR Code button to view, download, or test 1-link failover.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links or URLs..."
                className="w-full bg-[#090d16] border border-white/10 focus:border-orange-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Links List */}
          <div className="divide-y divide-white/5">
            {filteredRoutes.slice(0, 6).map((route) => (
              <div
                key={route.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition"
              >
                {/* Shortlink & Destinations */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap font-mono">
                    <button
                      onClick={() => onOpenFailoverSimulator && onOpenFailoverSimulator(route)}
                      className="text-sm font-bold text-white hover:text-orange-400 transition cursor-pointer text-left"
                      title="Click to test single-link auto-failover"
                    >
                      {shortLabel(route)}
                    </button>
                    <button
                      onClick={() => onCopyLink(clickUrl(route))}
                      className="text-slate-500 hover:text-orange-400 transition cursor-pointer p-0.5"
                      title="Copy shortlink"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Active Target Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        route.activeRoutingTarget === 'Fallback'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          route.activeRoutingTarget === 'Fallback'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-emerald-400'
                        }`}
                      />
                      {route.activeRoutingTarget === 'Fallback'
                        ? 'Backup Active (B)'
                        : 'Primary Active (A)'}
                    </span>
                  </div>

                  {/* Destination URLs */}
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="truncate max-w-xs text-slate-300" title={route.originalDestination}>
                      <span className="text-emerald-400 font-bold mr-1">A:</span>
                      {route.originalDestination.replace('https://', '')}
                    </span>
                    {route.fallbackDestination && (
                      <span
                        className="truncate max-w-xs text-amber-300/80"
                        title={route.fallbackDestination}
                      >
                        <span className="text-amber-400 font-bold mr-1">B:</span>
                        {route.fallbackDestination.replace('https://', '')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Clicks & Quick Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center font-mono">
                  <span className="text-xs font-bold text-white mr-2">
                    {route.clicks.toLocaleString()} clicks · {(route.qrScans || 0).toLocaleString()} scans
                  </span>

                  {/* QR Code Button */}
                  {onOpenQrModal && (
                    <button
                      onClick={() => onOpenQrModal(route)}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                      title="Generate & Download QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>
                  )}

                  {/* Test Failover Button */}
                  {onOpenFailoverSimulator && (
                    <button
                      onClick={() => onOpenFailoverSimulator(route)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition cursor-pointer flex items-center gap-1"
                      title="Test Auto-Failover"
                    >
                      <Zap className="w-3 h-3 text-orange-400" />
                      <span>Failover</span>
                    </button>
                  )}

                  {/* Visit Active Site */}
                  <a
                    href={
                      route.activeRoutingTarget === 'Fallback'
                        ? route.fallbackDestination || route.originalDestination
                        : route.originalDestination
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                    title="Open active website in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* View All Links button */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Showing top recent routes with auto-failover</span>
            <button
              onClick={() => onSwitchView('campaigns')}
              className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Links</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
