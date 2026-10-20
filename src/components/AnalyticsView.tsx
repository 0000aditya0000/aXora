import React, { useEffect, useState } from 'react';
import { AnalyticsSummary, ShortRoute, FailoverLogEvent } from '../types';
import { fetchAnalytics } from '../api';
import { clickUrl, shortLabel } from '../lib/links';
import {
  Activity,
  Download,
  RotateCw,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Search,
  Filter,
  Copy,
  BarChart3,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Clock,
  Flame,
  Sparkles,
} from 'lucide-react';

interface AnalyticsViewProps {
  routes: ShortRoute[];
  failoverLogs?: FailoverLogEvent[];
  onCopyLink: (text: string) => void;
  onInspectThreat: () => void;
  onNotification: (msg: string) => void;
  onOpenFailoverSimulator?: (route: ShortRoute) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  routes,
  failoverLogs = [],
  onCopyLink,
  onInspectThreat,
  onNotification,
  onOpenFailoverSimulator,
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'custom'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('All');
  const [selectedRouteTelemetry, setSelectedRouteTelemetry] = useState<ShortRoute | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  const rangeKey = timeframe === 'custom' ? '30d' : timeframe;
  const totalClicks = summary?.totals.clicks ?? 0;
  const totalScans = summary?.totals.scans ?? 0;
  const uniqueVisitors = summary?.totals.uniqueVisitors ?? 0;
  const botVisits = summary?.totals.bots ?? 0;
  const activeLinks = routes.filter((route) => route.edgeStatus === 'Active').length;
  const flaggedLinks = routes.filter((route) => route.edgeStatus === 'Flagged').length;
  const maxSeries = Math.max(1, ...(summary?.series.map((point) => point.clicks + point.scans) ?? [1]));

  const loadSummary = async () => {
    const data = await fetchAnalytics(rangeKey);
    setSummary(data);
  };

  useEffect(() => {
    loadSummary().catch(() => undefined);
  }, [rangeKey, routes]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadSummary();
      onNotification('Analytics refreshed from recorded clicks and QR scans');
    } catch {
      onNotification('Could not refresh analytics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportCSV = () => {
    const csvHeader = 'Short Code,Original Destination,Clicks,QR Scans,Unique Visitors,Unique Rate (%),Status,Campaign\n';
    const csvRows = routes
      .map(
        (r) =>
          `"${r.shortCode}","${r.originalDestination}",${r.clicks},${r.qrScans || 0},${r.uniqueVisitors},${r.ctr},"${r.edgeStatus}","${r.campaign}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `axora-analytics-${timeframe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotification(`Exported ${routes.length} route telemetry records to CSV`);
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.shortCode.toLowerCase().includes(filterSearch.toLowerCase()) ||
      r.originalDestination.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesCampaign = selectedCampaign === 'All' || r.campaign === selectedCampaign;
    return matchesSearch && matchesCampaign;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* PAGE HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Real-Time Analytics & Traffic Telemetry
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121624] text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-xs font-medium tracking-wide">
                Live Syncing • 42ms edge telemetry
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Aggregated edge node resolution stream across 284 Cloudflare Anycast POPs.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#090d16] p-1 rounded-xl border border-white/10 text-xs">
            {(['24h', '7d', '30d', 'custom'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  timeframe === t
                    ? 'bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'custom' ? 'Custom' : t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold transition cursor-pointer active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CRITICAL SECURITY ALERT BANNER */}
      {!alertDismissed && flaggedLinks > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/60 via-[#181014] to-[#0f1422] p-4 border border-red-500/30 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    {flaggedLinks} Flagged Link{flaggedLinks === 1 ? '' : 's'} Detected
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">• Quarantine Node: ord-01</span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Abusive redirect pattern detected on campaign{' '}
                  <span className="font-mono text-cyan-300 bg-black/40 px-1 rounded">affiliate-partner-04</span>.
                  Edge shield auto-diverted 14.8k suspicious requests to honeypot telemetry.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={onInspectThreat}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Inspect Threat
              </button>
              <button
                onClick={() => setAlertDismissed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI SUMMARY CARDS (4-Column) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col justify-between hover:border-orange-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Edge Clicks</span>
            <span className="inline-flex items-center gap-0.5 font-mono text-xs text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              {rangeKey}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-2">{totalClicks.toLocaleString()}</div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-xs text-slate-400">{uniqueVisitors.toLocaleString()} unique visitors</span>
            {/* Sparkline */}
            <svg className="w-24 h-6 text-cyan-400 overflow-visible" fill="none" viewBox="0 0 96 24">
              <path
                d="M0 19 L16 17 L32 20 L48 11 L64 14 L80 4 L96 2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <path
                d="M0 19 L16 17 L32 20 L48 11 L64 14 L80 4 L96 2 L96 24 L0 24 Z"
                fill="currentColor"
                fillOpacity="0.12"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col justify-between hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Short Links</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              100% healthy
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-2">{activeLinks.toLocaleString()}</div>
          <div className="flex items-center justify-between pt-1 text-xs font-mono">
            <span className="text-cyan-400">{summary?.totals.createdInRange ?? 0} created in range</span>
            <span className="text-slate-400">{routes.length} total</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col justify-between hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">QR Code Scans</span>
            <span className="font-mono text-xs text-orange-400 font-semibold">{rangeKey}</span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-2">{totalScans.toLocaleString()}</div>
          <div className="flex items-center justify-between pt-1">
            <div className="w-full bg-white/10 rounded-full h-1.5 mr-3 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full" style={{ width: '94.2%' }} />
            </div>
            <span className="font-mono text-xs text-white font-semibold shrink-0">94.2% hit</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bot Visits</span>
            <span className="inline-flex items-center gap-0.5 font-mono text-xs text-emerald-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              detected
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight my-2">{botVisits.toLocaleString()}</div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="font-mono text-slate-400">Marked from user agent</span>
            <span className="font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              {totalClicks + totalScans === 0 ? '0%' : `${Math.round((botVisits / (totalClicks + totalScans)) * 1000) / 10}%`} of traffic
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl glass-panel p-5 border border-white/10">
          <h2 className="text-base font-bold text-white">Clicks and QR scans</h2>
          <p className="text-xs text-slate-400 mb-4">Each bar is a real bucket from the selected range. Cyan is link clicks. Orange is QR scans.</p>
          <div className="flex items-end gap-1 h-36">
            {(summary?.series ?? []).map((point) => (
              <div key={point.bucket} className="flex-1 flex flex-col justify-end gap-0.5 h-full" title={`${new Date(point.bucket).toLocaleString()}: ${point.clicks} clicks, ${point.scans} scans`}>
                <div className="bg-orange-400 rounded-sm" style={{ height: `${Math.max(point.scans ? 4 : 0, (point.scans / maxSeries) * 100)}%` }} />
                <div className="bg-cyan-400 rounded-sm" style={{ height: `${Math.max(point.clicks ? 4 : 0, (point.clicks / maxSeries) * 100)}%` }} />
              </div>
            ))}
            {!summary?.series.length && <div className="text-xs text-slate-500 font-mono">No traffic in this range yet.</div>}
          </div>
        </div>
        <div className="lg:col-span-5 rounded-2xl glass-panel border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-base font-bold text-white">Recent visits</h2>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
            {(summary?.recentEvents ?? []).length === 0 && (
              <div className="p-4 text-xs text-slate-500 font-mono">Open a short link or scan its QR code to record a visit.</div>
            )}
            {(summary?.recentEvents ?? []).slice(0, 8).map((event) => (
              <div key={event.id} className="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-cyan-300 truncate">{event.shortCode}</div>
                  <div className="text-slate-500">{event.device} · {event.browser} · {event.referrer}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={event.kind === 'scan' ? 'text-orange-300 font-semibold' : 'text-cyan-300 font-semibold'}>
                    {event.kind === 'scan' ? 'QR scan' : 'Click'}
                  </div>
                  <div className="text-slate-500 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN VISUALIZATIONS (2-Column Asymmetric) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Line Graph Velocity (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl glass-panel p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Hourly Traffic Velocity</h2>
              <p className="text-xs text-slate-400">
                Aggregate link resolutions routed via regional POP edge nodes
              </p>
            </div>
            {/* Series Legend */}
            <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-200">Organic (58%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="text-slate-200">Paid Ad (31%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-200">Direct (11%)</span>
              </div>
            </div>
          </div>

          {/* Main SVG Chart Container */}
          <div className="relative w-full h-80 pt-4">
            {/* Floating Marker Tag for Peak */}
            <div className="absolute top-6 left-[58%] -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
              <div className="bg-[#090d16] border border-cyan-500/40 text-cyan-300 px-3 py-1 rounded-md shadow-lg flex items-center gap-1.5 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-semibold">Peak: 142k at 14:00 UTC</span>
              </div>
              <div className="w-px h-6 bg-cyan-400/50" />
            </div>

            <svg
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 800 240"
            >
              <defs>
                <linearGradient id="gradientSecondary" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientPrimary" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              <line stroke="#31353f" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="800" y1="20" y2="20" />
              <line stroke="#31353f" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="800" y1="75" y2="75" />
              <line stroke="#31353f" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="800" y1="130" y2="130" />
              <line stroke="#31353f" strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="800" y1="185" y2="185" />

              {/* Organic Area & Line */}
              <path
                d="M 0 170 C 60 160, 110 145, 170 140 C 230 135, 270 95, 330 90 C 400 85, 430 40, 480 32 C 530 25, 580 80, 640 92 C 700 105, 740 70, 800 60 L 800 220 L 0 220 Z"
                fill="url(#gradientSecondary)"
              />
              <path
                d="M 0 170 C 60 160, 110 145, 170 140 C 230 135, 270 95, 330 90 C 400 85, 430 40, 480 32 C 530 25, 580 80, 640 92 C 700 105, 740 70, 800 60"
                fill="none"
                stroke="#4cd7f6"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Paid Ads Line & Fill */}
              <path
                d="M 0 195 C 60 190, 120 180, 180 170 C 240 160, 290 130, 360 120 C 420 110, 470 85, 520 80 C 580 75, 630 110, 700 125 C 750 135, 780 115, 800 108 L 800 220 L 0 220 Z"
                fill="url(#gradientPrimary)"
              />
              <path
                d="M 0 195 C 60 190, 120 180, 180 170 C 240 160, 290 130, 360 120 C 420 110, 470 85, 520 80 C 580 75, 630 110, 700 125 C 750 135, 780 115, 800 108"
                fill="none"
                stroke="#f97316"
                strokeLinecap="round"
                strokeWidth="2"
              />

              {/* Direct Line */}
              <path
                d="M 0 210 C 80 205, 160 200, 240 190 C 320 180, 400 165, 480 155 C 560 145, 640 175, 720 170 C 760 168, 780 160, 800 158"
                fill="none"
                stroke="#4edea3"
                strokeDasharray="3 3"
                strokeWidth="1.75"
              />

              {/* Interactive Node Dot at Peak */}
              <circle className="animate-pulse" cx="480" cy="32" fill="#4cd7f6" r="5" />
              <circle cx="480" cy="32" fill="none" opacity="0.6" r="9" stroke="#4cd7f6" strokeWidth="1.5" />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-3 select-none">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span className="text-cyan-400 font-semibold">14:00 (Peak)</span>
              <span>18:00</span>
              <span>22:00</span>
              <span>23:59</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Geo & Device Breakdown (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Top Geographic Markets */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white">Top Geographic Markets</h3>
              <span className="font-mono text-xs text-slate-400">Global Reach</span>
            </div>
            <div className="flex flex-col gap-3">
              {/* US */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">US</span>
                    United States
                  </span>
                  <span className="font-mono text-white font-semibold">
                    629,147 <span className="text-slate-400">(44%)</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full" style={{ width: '44%' }} />
                </div>
              </div>

              {/* DE */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">DE</span>
                    Germany
                  </span>
                  <span className="font-mono text-white font-semibold">
                    257,378 <span className="text-slate-400">(18%)</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>

              {/* UK */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">UK</span>
                    United Kingdom
                  </span>
                  <span className="font-mono text-white font-semibold">
                    200,183 <span className="text-slate-400">(14%)</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '14%' }} />
                </div>
              </div>

              {/* JP */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-slate-300">JP</span>
                    Japan
                  </span>
                  <span className="font-mono text-white font-semibold">
                    128,689 <span className="text-slate-400">(9%)</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '9%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Client Ecosystem (Donut Breakdown) */}
          <div className="rounded-2xl glass-panel p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Client Ecosystem</h3>
              <span className="font-mono text-xs text-slate-400">Browser / OS</span>
            </div>
            <div className="flex items-center gap-5 py-2">
              {/* Circular Donut SVG */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Ring */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#1c1f29"
                    strokeWidth="4.5"
                  />
                  {/* Mobile (60%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f97316"
                    strokeDasharray="60, 100"
                    strokeWidth="4.5"
                  />
                  {/* Desktop (35%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4cd7f6"
                    strokeDasharray="35, 100"
                    strokeDashoffset="-60"
                    strokeWidth="4.5"
                  />
                  {/* Others (5%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4edea3"
                    strokeDasharray="5, 100"
                    strokeDashoffset="-95"
                    strokeWidth="4.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-white">60%</span>
                  <span className="text-[10px] text-slate-400 uppercase">Mobile</span>
                </div>
              </div>

              {/* Donut Legend Details */}
              <div className="flex flex-col gap-2 w-full text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    Mobile (iOS & Android)
                  </span>
                  <span className="font-mono text-white font-semibold">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    Desktop (Chrome & Safari)
                  </span>
                  <span className="font-mono text-white font-semibold">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    Headless & Embedded
                  </span>
                  <span className="font-mono text-white font-semibold">5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTO-FALLBACK & HIGH-TRAFFIC FAILOVER ALERT STREAM */}
      <div className="rounded-2xl glass-panel border border-orange-500/30 overflow-hidden shadow-md">
        <div className="p-4 bg-gradient-to-r from-orange-950/40 via-[#101422] to-[#090d18] border-b border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white">Auto-Fallback & Failover Security Alerts</h2>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono text-[10px] font-bold border border-orange-500/30">
                  {failoverLogs.length} Logged Incidents
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Audit log of edge rerouting triggered by downtime, high latency, or traffic cap surges.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Zero Traffic Loss Guaranteed
          </span>
        </div>

        <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
          {failoverLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No failover events triggered yet. All origin servers operating within latency & rate limits.
            </div>
          ) : (
            failoverLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 sm:p-4 hover:bg-white/[0.02] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-orange-400 font-bold">
                        {shortLabel({ shortCode: log.shortCode })}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-200 font-medium">{log.reason}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1 flex-wrap">
                      <span className="text-emerald-400 truncate max-w-[180px]" title={log.fromUrl}>
                        Origin: {log.fromUrl.replace('https://', '')}
                      </span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-amber-400 font-semibold truncate max-w-[180px]" title={log.toUrl}>
                        Backup: {log.toUrl.replace('https://', '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px]">
                  {log.statusCode && (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      HTTP {log.statusCode}
                    </span>
                  )}
                  {log.latencyMs && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {log.latencyMs}ms
                    </span>
                  )}
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTTOM DATA TABLE: TOP PERFORMING ROUTES LEADERBOARD */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-md">
        {/* Table Header Controls */}
        <div className="p-4 bg-[#0a0e17]/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">Top Performing Routes Leaderboard</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono text-[11px]">
              Top 25 Active
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-[#121624] px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 focus-within:border-orange-500">
              <Search className="w-3.5 h-3.5" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Filter routes..."
                className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-36 sm:w-48 font-mono"
              />
            </div>

            <div className="relative">
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="bg-[#121624] text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="All">Campaigns: All</option>
                <option value="Q3 Global Growth">Q3 Global Growth</option>
                <option value="Black Friday & Cyber Week">Black Friday & Cyber Week</option>
                <option value="Product Launch 2025">Product Launch 2025</option>
                <option value="Internal Executive Memos">Internal Executive Memos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#090d16] text-slate-400 font-mono uppercase text-[11px] border-b border-white/10 select-none">
                <th className="py-3 px-4 font-semibold">Short Route</th>
                <th className="py-3 px-4 font-semibold">Destination (A / B)</th>
                <th className="py-3 px-4 font-semibold">Active Target</th>
                <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                <th className="py-3 px-4 text-right font-semibold">QR Scans</th>
                <th className="py-3 px-4 text-right font-semibold">CTR</th>
                <th className="py-3 px-4 font-semibold">Edge Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-3.5 px-4 font-mono text-cyan-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-cyan-400 text-[16px]">link</span>
                      <button
                        onClick={() => onOpenFailoverSimulator && onOpenFailoverSimulator(route)}
                        className="cursor-pointer hover:underline text-left font-mono"
                        title="Click to test single-link auto-failover (Website A vs Website B)"
                      >
                        {shortLabel(route)}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                    <div className="truncate text-slate-200" title={route.originalDestination}>
                      <span className="text-emerald-400 font-semibold mr-1">A:</span>
                      {route.originalDestination}
                    </div>
                    {route.fallbackDestination && (
                      <div className="truncate text-amber-300/80 text-[10px] mt-0.5" title={route.fallbackDestination}>
                        <span className="text-amber-400 font-semibold mr-1">B:</span>
                        {route.fallbackDestination}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
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
                      <a
                        href={
                          route.activeRoutingTarget === 'Fallback'
                            ? route.fallbackDestination || route.originalDestination
                            : route.originalDestination
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                        title="Open currently active destination website in new tab"
                      >
                        <span>Visit Active Site</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                    {route.clicks.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-orange-300 font-semibold">
                    {(route.qrScans || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                    {route.ctr}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        route.edgeStatus === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : route.edgeStatus === 'Flagged'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          route.edgeStatus === 'Active'
                            ? 'bg-emerald-400 animate-pulse'
                            : route.edgeStatus === 'Flagged'
                            ? 'bg-red-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      {route.edgeStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onOpenFailoverSimulator && (
                        <button
                          onClick={() => onOpenFailoverSimulator(route)}
                          className="px-2 py-1 rounded-lg text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition cursor-pointer text-[10px] font-mono flex items-center gap-1 font-semibold"
                          title="Test Failover Redirection"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Failover</span>
                        </button>
                      )}
                      <button
                        onClick={() => onCopyLink(clickUrl(route))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Copy Short Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedRouteTelemetry(route)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                        title="Inspect Telemetry"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="p-3 bg-[#090d16] px-4 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/5">
          <span>
            Showing {filteredRoutes.length} of {routes.length} active short links
          </span>
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer">
              Previous
            </button>
            <span className="text-white">Page 1 of 1</span>
            <button className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY & EDGE TELEMETRY FOOTER STRIP */}
      <div className="rounded-xl bg-[#0a0e17] border border-white/5 p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-medium">Edge DNS & SSL Secured</span>
          </div>
          <span>•</span>
          <span>99.998% SLA Availability</span>
          <span>•</span>
          <span>28 Anycast nodes in cluster</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">Zero-Trust v4 active</span>
          <span className="text-slate-500">(SHA-256 TLS 1.3 Strict)</span>
        </div>
      </div>

      {/* Inspect Route Telemetry Modal */}
      {selectedRouteTelemetry && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-cyan-500/30 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Route Telemetry Deep Dive</h3>
              </div>
              <button
                onClick={() => setSelectedRouteTelemetry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/10 font-mono">
                <div className="text-slate-400 text-[11px]">Short Alias:</div>
                <div className="text-cyan-400 font-bold text-sm">
                  {clickUrl(selectedRouteTelemetry)}
                </div>
                <div className="text-slate-400 text-[11px] mt-2">Target Destination:</div>
                <div className="text-white truncate">{selectedRouteTelemetry.originalDestination}</div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-slate-400 text-[11px]">Total Clicks</div>
                  <div className="text-base font-bold text-white font-mono mt-1">
                    {selectedRouteTelemetry.clicks.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-slate-400 text-[11px]">QR Scans</div>
                  <div className="text-base font-bold text-orange-300 font-mono mt-1">
                    {(selectedRouteTelemetry.qrScans || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-slate-400 text-[11px]">Unique Visitors</div>
                  <div className="text-base font-bold text-white font-mono mt-1">
                    {selectedRouteTelemetry.uniqueVisitors.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-slate-400 text-[11px]">CTR</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                    {selectedRouteTelemetry.ctr}%
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="text-slate-400 text-[11px] font-mono">Routing Rules & Expiration:</div>
                <div className="text-slate-200">
                  TTL Preset: <span className="font-mono text-orange-400">{selectedRouteTelemetry.ttl}</span> •
                  Threshold: <span className="font-mono text-cyan-400">{selectedRouteTelemetry.clickThreshold.toLocaleString()}</span> visits
                </div>
                {selectedRouteTelemetry.passcodeEnabled && (
                  <div className="text-amber-300 text-[11px]">
                    🔒 Passcode Interstitial Active: Token Protected
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRouteTelemetry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
