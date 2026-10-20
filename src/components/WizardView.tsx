import React, { useState } from 'react';
import { ShortRoute } from '../types';
import { clickUrl, scanUrl, shortLabel, shortPrefix } from '../lib/links';
import { QRCodeDisplay } from './QRCodeDisplay';
import { FailoverSimulationModal } from './FailoverSimulationModal';
import {
  Link2,
  Check,
  Shield,
  Key,
  Gauge,
  Monitor,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Smartphone,
  Zap,
  Flame,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';

interface WizardViewProps {
  onSaveRoute: (route: Partial<ShortRoute>) => void | Promise<ShortRoute | null>;
  onNotification: (msg: string) => void;
  onCancel: () => void;
}

export const WizardView: React.FC<WizardViewProps> = ({
  onSaveRoute,
  onNotification,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Form State - Step 1
  const [destUrl, setDestUrl] = useState(
    'https://pulseanalytics.cloud/enterprise/campaigns/q3-global-accelerator?source=edge_inbound'
  );
  const [fallbackUrl, setFallbackUrl] = useState(
    'https://backup-mirror.axora.io/emergency-q3-accelerator'
  );
  const [failoverEnabled, setFailoverEnabled] = useState(true);
  const [alias, setAlias] = useState('q3-growth');
  const [campaign, setCampaign] = useState('Q3 Global Growth');
  const [tags, setTags] = useState<string[]>(['#paid-social', '#product-launch-2025']);
  const [newTagInput, setNewTagInput] = useState('');

  // Step 2 State - Security & Failover Governance
  const [passcodeEnabled, setPasscodeEnabled] = useState(false);
  const [passcode, setPasscode] = useState('axora_sec_997xQ');
  const [showPasscode, setShowPasscode] = useState(false);
  const [clickLimit, setClickLimit] = useState(10000);
  const [ttl, setTtl] = useState<'24h' | '7d' | '30d' | 'custom'>('30d');
  const [iosTarget, setIosTarget] = useState(
    'https://apps.apple.com/app/pulse-analytics-pro/id1599382104'
  );
  const [androidTarget, setAndroidTarget] = useState(
    'https://play.google.com/store/apps/details?id=cloud.pulseanalytics.android'
  );
  const [desktopTarget, setDesktopTarget] = useState(
    'https://pulseanalytics.cloud/app/dashboard-enterprise-access'
  );

  // Failover Governance Rules
  const [maxLatencyThreshold, setMaxLatencyThreshold] = useState(2000);
  const [trafficRateCap, setTrafficRateCap] = useState(500);
  const [httpFailoverCodes, setHttpFailoverCodes] = useState<string[]>([
    '500',
    '502',
    '503',
    '504',
    '429',
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [isFailoverSimulatorOpen, setIsFailoverSimulatorOpen] = useState(false);

  const toggleHttpCode = (code: string) => {
    if (httpFailoverCodes.includes(code)) {
      if (httpFailoverCodes.length > 1) {
        setHttpFailoverCodes(httpFailoverCodes.filter((c) => c !== code));
      }
    } else {
      setHttpFailoverCodes([...httpFailoverCodes, code]);
    }
  };

  const handleAddTag = () => {
    let t = newTagInput.trim();
    if (!t) return;
    if (!t.startsWith('#')) t = '#' + t;
    if (!tags.includes(t)) {
      setTags([...tags, t]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handlePasteDestination = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setDestUrl(text);
        onNotification('Pasted Primary URL from clipboard');
      }
    } catch {
      onNotification('Please paste directly into the input field');
    }
  };

  const handlePasteFallback = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setFallbackUrl(text);
        onNotification('Pasted Fallback URL from clipboard');
      }
    } catch {
      onNotification('Please paste directly into the input field');
    }
  };

  const handleCopyShortUrl = () => {
    const url = clickUrl(alias || 'link');
    navigator.clipboard.writeText(url);
    onNotification(`Copied shortlink to clipboard: ${url}`);
  };

  const handleSubmit = () => {
    setIsDeploying(true);
    setTimeout(async () => {
      const saved = await onSaveRoute({
        shortCode: alias || 'alias',
        originalDestination: destUrl,
        fallbackDestination: failoverEnabled ? fallbackUrl : undefined,
        failoverEnabled,
        maxLatencyThreshold,
        trafficRateCap,
        httpFailoverCodes,
        activeRoutingTarget: 'Primary',
        healthStatus: 'Healthy',
        currentLatencyMs: 110,
        currentTrafficRate: 0,
        failoverEventsCount: 0,
        campaign,
        tags,
        passcodeEnabled,
        passcode: passcodeEnabled ? passcode : undefined,
        clickThreshold: clickLimit,
        ttl,
        iosTarget,
        androidTarget,
        desktopTarget,
        edgeStatus: 'Active',
      });
      setIsDeploying(false);
      if (saved) {
        onNotification(`Short link ${shortLabel(saved)} is live. Clicks and QR scans are tracked.`);
      }
    }, 900);
  };

  // Synthetic route representation for the simulator
  const currentPreviewRoute: ShortRoute = {
    id: 'lnk_preview',
    shortCode: alias || 'q3-growth',
    originalDestination: destUrl,
    fallbackDestination: fallbackUrl,
    creator: 'aXora',
    clicks: 120,
    uniqueVisitors: 98,
    ctr: 14.2,
    edgeStatus: 'Active',
    campaign,
    tags,
    passcodeEnabled,
    clickThreshold: clickLimit,
    ttl,
    createdAt: new Date().toISOString(),
    failoverEnabled,
    maxLatencyThreshold,
    trafficRateCap,
    httpFailoverCodes,
    activeRoutingTarget: 'Primary',
    healthStatus: 'Healthy',
    currentLatencyMs: 118,
    currentTrafficRate: 85,
  };

  return (
    <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="hover:text-white transition cursor-pointer" onClick={onCancel}>
            Workspace
          </span>
          <span>/</span>
          <span className="hover:text-white transition cursor-pointer" onClick={onCancel}>
            Links
          </span>
          <span>/</span>
          <span className="text-orange-400 font-semibold">Create New Link</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Create Short Link Wizard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure edge-accelerated redirects, auto-fallback protection, and multi-platform device routing.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121624] border border-white/10 text-xs font-mono text-slate-300 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Anycast Layer 4 Ready</span>
            <span className="text-slate-600">•</span>
            <span className="text-orange-400 font-medium">Auto-Failover V2</span>
          </div>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 Indicator */}
        <button
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-4 p-4 rounded-xl relative overflow-hidden transition-all text-left cursor-pointer ${
            activeStep === 1
              ? 'bg-gradient-to-r from-orange-500/20 to-[#0f1422] border border-orange-500/40 shadow-lg'
              : 'bg-[#0f1422] border border-white/10 hover:border-white/20'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              activeStep === 1 ? 'bg-orange-500 text-white shadow' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {activeStep > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-semibold">
                Step 01
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">
                Primary & Fallback URLs
              </span>
            </div>
            <span className="text-sm font-semibold text-white">Destination & Failover Setup</span>
          </div>
        </button>

        {/* Step 2 Indicator */}
        <button
          onClick={() => setActiveStep(2)}
          className={`flex items-center gap-4 p-4 rounded-xl relative overflow-hidden transition-all text-left cursor-pointer ${
            activeStep === 2
              ? 'bg-gradient-to-r from-orange-500/20 to-[#0f1422] border border-orange-500/40 shadow-lg'
              : 'bg-[#0f1422] border border-white/10 hover:border-white/20'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              activeStep === 2 ? 'bg-orange-500 text-white shadow' : 'bg-white/10 text-slate-300'
            }`}
          >
            2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Step 02
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400">
                Thresholds & Security
              </span>
            </div>
            <span className="text-sm font-semibold text-white">Failover Rules & Protection</span>
          </div>
        </button>
      </div>

      {/* 2-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Configuration Studio (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* STEP 1: DESTINATION, FALLBACK & ALIAS */}
          {activeStep === 1 && (
            <div className="p-6 sm:p-7 rounded-2xl glass-panel border border-white/10 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Link2 className="w-5 h-5 text-orange-400" />
                  <h2 className="text-base font-bold text-white">Primary & Fallback Destination Setup</h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  Anycast Route Engine
                </span>
              </div>

              {/* Primary Destination URL (Website A) */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Primary Destination URL ("Website A") <span className="text-orange-400">*</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Default Target</span>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={destUrl}
                    onChange={(e) => setDestUrl(e.target.value)}
                    placeholder="https://yourcompany.com/destination-page"
                    className="w-full bg-[#090d16] border border-white/15 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-slate-600 outline-none transition pr-20"
                  />
                  <button
                    type="button"
                    onClick={handlePasteDestination}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition font-sans cursor-pointer"
                  >
                    Paste
                  </button>
                </div>

                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-medium">Origin Validated • HTTP 200 OK • Latency: 24ms ping</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-300">Website A (Live)</span>
                </div>
              </div>

              {/* AUTO-FALLBACK & HIGH-TRAFFIC FAILOVER CONTAINER */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121626] to-[#0a0d18] border border-orange-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Automatic Failover & High-Traffic Protection
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Automatically divert visitors to Backup URL when Website A suffers downtime, high latency, or traffic caps.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFailoverEnabled(!failoverEnabled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      failoverEnabled ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        failoverEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {failoverEnabled && (
                  <div className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1.5 text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Fallback Destination URL ("Website B" Backup)
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">Downtime / Overflow Target</span>
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={fallbackUrl}
                          onChange={(e) => setFallbackUrl(e.target.value)}
                          placeholder="https://backup-mirror.yourcompany.com/emergency-landing"
                          className="w-full bg-[#090d16] border border-amber-500/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-amber-100 font-mono placeholder-slate-600 outline-none transition pr-20"
                        />
                        <button
                          type="button"
                          onClick={handlePasteFallback}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition font-sans cursor-pointer"
                        >
                          Paste
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Failover Logic Preview Strip */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Dynamic Redirection Logic:</span>
                        <span className="text-orange-400">Edge HEAD Probe Active</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Website A
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className="px-2 py-1 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[11px]">
                          Check: 5xx, &gt;{maxLatencyThreshold}ms, &gt;{trafficRateCap} cpm
                        </span>
                        <span className="text-slate-500">➔</span>
                        <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          Website B (Instant Failover)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Edge Short Alias */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>
                    Custom Edge Short Alias <span className="text-orange-400">*</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">Real-time lookup</span>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-white/15 focus-within:border-orange-500">
                  <span className="px-4 py-3 bg-[#0c101d] text-slate-400 text-xs sm:text-sm font-mono border-r border-white/10 select-none">
                    {shortPrefix()}
                  </span>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) =>
                      setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))
                    }
                    placeholder="custom-alias"
                    className="w-full bg-[#090d16] px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-slate-600 outline-none"
                  />
                  <div className="flex items-center px-3 bg-[#090d16]">
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ✓ Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Campaign Assignment & Organizational Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Campaign Alignment
                  </label>
                  <select
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                    className="w-full bg-[#090d16] border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 outline-none focus:border-orange-500"
                  >
                    <option>Q3 Global Growth</option>
                    <option>Product Launch 2025</option>
                    <option>Partner Referral Direct</option>
                    <option>Internal Executive Memos</option>
                    <option>Black Friday & Cyber Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Organizational Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#090d16] border border-white/15 rounded-xl min-h-[44px]">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/15 text-orange-300 text-xs font-mono"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 text-slate-400 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="+ Add tag"
                      className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-20 px-1 py-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Proceed to Step 2 Button */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white glow-orange-btn flex items-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Failover Rules & Security</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FAILOVER RULES & SECURITY GOVERNANCE */}
          {activeStep === 2 && (
            <div className="p-6 sm:p-7 rounded-2xl glass-panel border border-white/10 space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <h2 className="text-base font-bold text-white">Failover Rules & Security Governance</h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold uppercase">
                  Edge Protection Engine
                </span>
              </div>

              {/* FAILOVER RULES CONFIGURATION CARD */}
              <div className="p-5 rounded-2xl bg-[#090d18] border border-orange-500/30 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white">
                      Configurable Failover Trigger Rules
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Auto-Protection: {failoverEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {/* Max Latency Threshold Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      Max Latency Threshold
                    </span>
                    <span className="font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {maxLatencyThreshold} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={maxLatencyThreshold}
                    onChange={(e) => setMaxLatencyThreshold(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>500ms (Hyper-Sensitive)</span>
                    <span>2000ms (Standard Enterprise)</span>
                    <span>5000ms (Forgiving)</span>
                  </div>
                </div>

                {/* Max Traffic Rate Cap */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      Max Traffic Rate Cap (Overflow Protection)
                    </span>
                    <span className="font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      {trafficRateCap} clicks/min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={trafficRateCap}
                    onChange={(e) => setTrafficRateCap(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>100 cpm</span>
                    <span>500 cpm (Standard Spike)</span>
                    <span>2000 cpm (Viral Scale)</span>
                  </div>
                </div>

                {/* HTTP Failover Status Codes */}
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>HTTP Error Codes that Trigger Redirection to Website B:</span>
                    <span className="text-[10px] text-slate-400">Click to toggle codes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: '500', label: '500 Internal Error' },
                      { code: '502', label: '502 Bad Gateway' },
                      { code: '503', label: '503 Service Unavailable' },
                      { code: '504', label: '504 Gateway Timeout' },
                      { code: '429', label: '429 Rate Limited' },
                    ].map(({ code, label }) => {
                      const isSelected = httpFailoverCodes.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleHttpCode(code)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-orange-500/20 border border-orange-500 text-orange-300 font-bold'
                              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-orange-400' : 'bg-slate-600'
                            }`}
                          />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Passcode Protection & Click Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passcode Interstitial */}
                <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-orange-400" />
                      Passcode Interstitial
                    </span>
                    <button
                      type="button"
                      onClick={() => setPasscodeEnabled(!passcodeEnabled)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        passcodeEnabled ? 'bg-orange-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          passcodeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Gate endpoint with a secure one-time or shared secret token.
                  </p>
                  {passcodeEnabled && (
                    <div className="relative mt-2">
                      <input
                        type={showPasscode ? 'text' : 'password'}
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full bg-[#121624] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none pr-8 focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPasscode ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Click Threshold Cap */}
                <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      Click Threshold Cap
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Auto-Expire
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Deactivates instantly when usage limit is triggered.
                  </p>
                  <div className="flex items-center rounded-lg border border-white/15 bg-[#121624] overflow-hidden mt-2">
                    <button
                      type="button"
                      onClick={() => setClickLimit(Math.max(500, clickLimit - 1000))}
                      className="px-3 py-1.5 text-slate-300 hover:text-white bg-white/5 cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <div className="w-full text-center text-xs font-mono text-white">
                      {clickLimit.toLocaleString()} visits
                    </div>
                    <button
                      type="button"
                      onClick={() => setClickLimit(clickLimit + 1000)}
                      className="px-3 py-1.5 text-slate-300 hover:text-white bg-white/5 cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* TTL Policy */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Time-to-Live (TTL) Policy</span>
                  <span className="text-[11px] font-mono text-slate-400">Current zone: UTC</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['24h', '7d', '30d', 'custom'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTtl(t)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono transition text-center cursor-pointer ${
                        ttl === t
                          ? 'bg-orange-500 text-white font-semibold shadow'
                          : 'bg-[#090d16] text-slate-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {t === '24h'
                        ? '24 Hours'
                        : t === '7d'
                        ? '7 Days'
                        : t === '30d'
                        ? '30 Days'
                        : 'Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Device-Targeted Routing */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-orange-400" />
                    <span>Conditional Platform Device Routing</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">3 rules active</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#090d16] border border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                        Apple iOS Clients
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">Deep Link Active</span>
                    </div>
                    <input
                      type="text"
                      value={iosTarget}
                      onChange={(e) => setIosTarget(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none border-t border-white/5 pt-1.5"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#090d16] border border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-white">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        Android Mobile Clients
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">Play Store URI</span>
                    </div>
                    <input
                      type="text"
                      value={androidTarget}
                      onChange={(e) => setAndroidTarget(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none border-t border-white/5 pt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Step Navigation Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                >
                  ← Back to Step 1
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isDeploying}
                  className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white glow-orange-btn flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeploying ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Deploying to 284 POPs...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Generate Shortlink</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Edge Preview & QR Code (5 cols, sticky) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          {/* Live Endpoint Card */}
          <div className="p-6 rounded-2xl glass-panel border border-white/10 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Live Edge Preview
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Synced
              </span>
            </div>

            {/* Generated Short URL Banner */}
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-white/5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Generated Short URL</span>
                <button
                  type="button"
                  onClick={handleCopyShortUrl}
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-mono text-[11px] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy link</span>
                </button>
              </div>
              <div className="font-mono text-base font-bold text-white flex items-center gap-1">
                <span className="text-slate-400">{shortPrefix()}</span>
                <span className="text-orange-400">{alias || 'alias'}</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                <span className="text-emerald-400 font-bold">A:</span>
                <span className="truncate">{destUrl.replace('https://', '')}</span>
              </div>
              {failoverEnabled && (
                <div className="font-mono text-[11px] text-amber-400 truncate flex items-center gap-1">
                  <span className="text-amber-400 font-bold">B:</span>
                  <span className="truncate">{fallbackUrl.replace('https://', '')}</span>
                </div>
              )}
            </div>

            {/* FAILOVER REAL-TIME STATUS BADGE IN PREVIEW */}
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  Failover Status Badge
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                    failoverEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700/40 text-slate-400 border border-white/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      failoverEnabled ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {failoverEnabled ? 'Primary Active (Website A)' : 'Failover Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-white/5">
                <span>Origin Health: 24ms ping</span>
                <button
                  type="button"
                  onClick={() => setIsFailoverSimulatorOpen(true)}
                  className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Test Failover</span>
                </button>
              </div>
            </div>

            {/* Dynamic QR Code */}
            <div className="pt-2">
              <QRCodeDisplay url={scanUrl(alias || 'q3-growth')} slug={alias || 'q3-growth'} onNotification={onNotification} />
            </div>

            {/* Edge Propagation Latency Telemetry */}
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-white/5 flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Edge Propagation Matrix</span>
                <span className="font-mono text-emerald-400 text-[11px]">Global Anycast</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-full w-[98%] rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Synced across 284 Anycast POPs
                </span>
                <span className="text-slate-200">Zero Cold Start</span>
              </div>
            </div>
          </div>

          {/* CLI hint box */}
          <div className="p-3.5 rounded-xl glass-panel border border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <span>
                CLI failover support:{' '}
                <code className="text-orange-300 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                  axora links create --failover {alias || 'alias'}
                </code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-[#0a0e17]/95 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
          >
            Cancel & Discard
          </button>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Draft auto-saved 2s ago</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFailoverSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 text-xs font-semibold border border-orange-500/30 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Test Failover Redirection</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDeploying}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white glow-orange-btn transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {isDeploying ? (
              <span>Deploying...</span>
            ) : (
              <>
                <span>Save & Generate Short Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Failover Simulation Modal */}
      <FailoverSimulationModal
        isOpen={isFailoverSimulatorOpen}
        onClose={() => setIsFailoverSimulatorOpen(false)}
        route={currentPreviewRoute}
        onUpdateRouteFailover={(_id, _target, _health, _reason) => {
          // In wizard preview mode
        }}
        onNotification={onNotification}
      />
    </div>
  );
};
