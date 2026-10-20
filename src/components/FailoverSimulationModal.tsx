import React, { useState } from 'react';
import { ShortRoute, FailoverLogEvent } from '../types';
import { clickUrl, shortLabel } from '../lib/links';
import {
  X,
  ShieldAlert,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Flame,
  Clock,
  Gauge,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Radio,
  ArrowDownRight,
  Server,
  RefreshCw,
} from 'lucide-react';

interface FailoverSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ShortRoute | null;
  onUpdateRouteFailover: (
    routeId: string,
    target: 'Primary' | 'Fallback',
    health: 'Healthy' | 'Degraded' | 'Down',
    reason?: string,
    logEvent?: Omit<FailoverLogEvent, 'id' | 'timestamp'>
  ) => void;
  onNotification: (msg: string) => void;
}

export const FailoverSimulationModal: React.FC<FailoverSimulationModalProps> = ({
  isOpen,
  onClose,
  route,
  onUpdateRouteFailover,
  onNotification,
}) => {
  if (!isOpen || !route) return null;

  const [simulatedScenario, setSimulatedScenario] = useState<
    'normal' | 'downtime' | 'latency' | 'traffic'
  >(route.activeRoutingTarget === 'Fallback' ? 'downtime' : 'normal');
  const [isRunningProbe, setIsRunningProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    latencyMs: number;
    statusCode: number;
    trafficRate: number;
    redirectedTo: string;
    resolvedTarget: 'Primary' | 'Fallback';
    failoverTriggered: boolean;
    reason: string;
  } | null>(null);

  const fallbackUrl = route.fallbackDestination || 'https://backup-mirror.axora.io/fallback-page';
  const maxLatency = route.maxLatencyThreshold || 2000;
  const trafficCap = route.trafficRateCap || 500;
  const httpCodes = route.httpFailoverCodes || ['500', '502', '503', '504', '429'];

  const currentActiveUrl =
    route.activeRoutingTarget === 'Fallback' ? fallbackUrl : route.originalDestination;

  const runSimulation = (scenario: 'normal' | 'downtime' | 'latency' | 'traffic') => {
    setSimulatedScenario(scenario);
    setIsRunningProbe(true);
    setProbeResult(null);

    setTimeout(() => {
      let latency = 115;
      let statusCode = 200;
      let traffic = 210;
      let failover = false;
      let reason = 'Website A responded healthy (HTTP 200 OK, 115ms). Single short link routes to Primary.';

      if (!route.failoverEnabled) {
        reason = 'Failover protection disabled on this link. Directing traffic to Primary regardless of origin status.';
      } else if (scenario === 'downtime') {
        latency = 3150;
        statusCode = 503;
        traffic = 340;
        failover = true;
        reason = 'Failover Triggered: Website A returned HTTP 503 Service Unavailable. The same link automatically redirects visitor to Backup Website B!';
      } else if (scenario === 'latency') {
        latency = Math.round(maxLatency * 1.35);
        statusCode = 504;
        traffic = 290;
        failover = true;
        reason = `Failover Triggered: Website A exceeded latency cap (${latency}ms > ${maxLatency}ms). The same link automatically redirects visitor to Backup Website B!`;
      } else if (scenario === 'traffic') {
        latency = 840;
        statusCode = 429;
        traffic = Math.round(trafficCap * 1.45);
        failover = true;
        reason = `Failover Triggered: Website A traffic rate limit exceeded (${traffic} cpm > ${trafficCap} cpm). The same link automatically redirects visitor to Backup Website B!`;
      }

      const resolvedTarget = failover ? 'Fallback' : 'Primary';
      const redirectedTo = failover ? fallbackUrl : route.originalDestination;

      setProbeResult({
        latencyMs: latency,
        statusCode,
        trafficRate: traffic,
        redirectedTo,
        resolvedTarget,
        failoverTriggered: failover,
        reason,
      });

      setIsRunningProbe(false);

      // Propagate changes to route state
      onUpdateRouteFailover(
        route.id,
        resolvedTarget,
        failover ? 'Degraded' : 'Healthy',
        failover ? reason : undefined,
        failover
          ? {
              routeId: route.id,
              shortCode: route.shortCode,
              reason,
              fromUrl: route.originalDestination,
              toUrl: fallbackUrl,
              statusCode,
              latencyMs: latency,
            }
          : undefined
      );

      if (failover) {
        onNotification(`Auto-failover is on. Visitors to ${shortLabel(route)} go to the backup URL.`);
      } else {
        onNotification(`Primary is healthy. Visitors to ${shortLabel(route)} go to the main URL.`);
      }
    }, 600);
  };

  const handleTestBrowserRedirect = () => {
    const url = clickUrl(route);
    window.open(url, '_blank', 'noopener,noreferrer');
    onNotification(`Opened ${shortLabel(route)}. This visit is counted as a click.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel-glow border border-orange-500/30 rounded-2xl p-6 sm:p-8 bg-[#0b0e17] text-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                1-LINK HIGH-AVAILABILITY FAILOVER
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1.5 ${
                  route.activeRoutingTarget === 'Fallback'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    route.activeRoutingTarget === 'Fallback' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                Active Target: {route.activeRoutingTarget || 'Primary'} (
                {route.activeRoutingTarget === 'Fallback' ? 'Website B / Backup' : 'Website A / Primary'})
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Single-Link Auto-Fallback & Failover Tester
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Both original and backup websites are accessed through this exact 1 link:{' '}
              <span className="text-orange-400 font-mono font-bold">
                {clickUrl(route)}
              </span>
            </p>
          </div>
        </div>

        {/* Dynamic Visual Routing Flow Diagram */}
        <div className="p-4 rounded-xl bg-[#070a12] border border-orange-500/30 mb-6">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-orange-400">
              <Radio className="w-3.5 h-3.5" />
              Dynamic Edge Routing Topology
            </span>
            <span className="text-[10px] font-mono text-slate-400">1 Shortlink ➔ 2 Destinations</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
            {/* Input Link */}
            <div className="w-full sm:w-1/3 bg-[#121624] p-3 rounded-lg border border-orange-500/40 text-center">
              <span className="text-[10px] text-orange-400 block uppercase font-bold">User clicks 1 link</span>
              <span className="text-white font-bold truncate block">{shortLabel(route)}</span>
            </div>

            {/* Edge Decision Hub */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-xs font-bold">
                ⚡
              </div>
              <span className="text-[9px] text-slate-400 mt-1">Lightweight Probe</span>
            </div>

            {/* Output Targets */}
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              {/* Target A */}
              <div
                className={`p-2 rounded-lg border flex items-center justify-between text-[11px] transition ${
                  (probeResult ? probeResult.resolvedTarget === 'Primary' : route.activeRoutingTarget !== 'Fallback')
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40 font-bold'
                    : 'bg-black/30 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <div className="truncate mr-2">
                  <span className="text-emerald-400 mr-1.5 font-bold">Website A (Primary):</span>
                  <span className="truncate">{route.originalDestination}</span>
                </div>
                {(probeResult ? probeResult.resolvedTarget === 'Primary' : route.activeRoutingTarget !== 'Fallback') && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px]">
                    RECEIVING TRAFFIC
                  </span>
                )}
              </div>

              {/* Target B */}
              <div
                className={`p-2 rounded-lg border flex items-center justify-between text-[11px] transition ${
                  (probeResult ? probeResult.resolvedTarget === 'Fallback' : route.activeRoutingTarget === 'Fallback')
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300 ring-1 ring-amber-500/40 font-bold'
                    : 'bg-black/30 border-white/5 text-slate-500 opacity-60'
                }`}
              >
                <div className="truncate mr-2">
                  <span className="text-amber-400 mr-1.5 font-bold">Website B (Backup):</span>
                  <span className="truncate">{fallbackUrl}</span>
                </div>
                {(probeResult ? probeResult.resolvedTarget === 'Fallback' : route.activeRoutingTarget === 'Fallback') && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] animate-pulse">
                    FAILOVER ACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulation Trigger Controls */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span>Test Edge Behavior: Toggle Website A Status</span>
            <span className="text-[11px] text-slate-400">Click a test condition to observe failover:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => runSimulation('normal')}
              disabled={isRunningProbe}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                simulatedScenario === 'normal'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-emerald-400">Website A OK</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[11px] font-medium">Origin Normal (200 OK)</span>
              <span className="text-[10px] text-slate-400 mt-1">Routes to Website A</span>
            </button>

            <button
              onClick={() => runSimulation('downtime')}
              disabled={isRunningProbe}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                simulatedScenario === 'downtime'
                  ? 'bg-red-950/40 border-red-500/50 text-white shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-red-400">Website A Down</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <span className="text-[11px] font-medium">503 / Unreachable</span>
              <span className="text-[10px] text-amber-300 mt-1">Auto-fails to Website B</span>
            </button>

            <button
              onClick={() => runSimulation('latency')}
              disabled={isRunningProbe}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                simulatedScenario === 'latency'
                  ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-amber-400">Lag &gt; {maxLatency}ms</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] font-medium">Latency Spike</span>
              <span className="text-[10px] text-amber-300 mt-1">Auto-fails to Website B</span>
            </button>

            <button
              onClick={() => runSimulation('traffic')}
              disabled={isRunningProbe}
              className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                simulatedScenario === 'traffic'
                  ? 'bg-orange-950/40 border-orange-500/50 text-white shadow-lg'
                  : 'bg-black/40 border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-orange-400">Traffic Spike</span>
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-[11px] font-medium">&gt; {trafficCap} cpm Rate Cap</span>
              <span className="text-[10px] text-amber-300 mt-1">Auto-fails to Website B</span>
            </button>
          </div>
        </div>

        {/* Live Probe Execution Result */}
        {isRunningProbe ? (
          <div className="p-6 rounded-xl bg-black/50 border border-orange-500/30 flex items-center justify-center gap-3 text-orange-300 font-mono text-xs mb-6">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Lightweight edge probe testing Website A health...</span>
          </div>
        ) : (
          <div
            className={`p-4 rounded-xl border mb-6 transition-all ${
              (probeResult?.failoverTriggered || route.activeRoutingTarget === 'Fallback')
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold flex items-center gap-1.5 uppercase">
                {(probeResult?.failoverTriggered || route.activeRoutingTarget === 'Fallback') ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    Failover Active: {shortLabel(route)} redirects to the backup URL.
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Healthy: {shortLabel(route)} redirects to the primary URL.
                  </>
                )}
              </span>
              <span className="text-[11px] font-mono opacity-80">
                {probeResult
                  ? `Latency: ${probeResult.latencyMs}ms · HTTP ${probeResult.statusCode}`
                  : `Current Health: ${route.healthStatus || 'Healthy'}`}
              </span>
            </div>

            <div className="text-xs font-mono p-2.5 rounded bg-black/60 border border-white/10 text-white mb-2 break-all flex items-center justify-between gap-2">
              <span>Resolved Destination ➔ {probeResult ? probeResult.redirectedTo : currentActiveUrl}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  (probeResult?.resolvedTarget === 'Fallback' || route.activeRoutingTarget === 'Fallback')
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {(probeResult?.resolvedTarget === 'Fallback' || route.activeRoutingTarget === 'Fallback')
                  ? 'Website B (Backup)'
                  : 'Website A (Primary)'}
              </span>
            </div>

            <p className="text-[11px] opacity-90">
              {probeResult?.reason ||
                (route.activeRoutingTarget === 'Fallback'
                  ? 'Failover is active on this link. Any visitor navigating to this single shortlink will be routed directly to Website B.'
                  : 'All health checks passing. Single shortlink routes directly to primary Website A.')}
            </p>
          </div>
        )}

        {/* Where to Check the Active Website Guide */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 mb-6 space-y-1.5">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-orange-400" />
            Where to check which website is active at any time:
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-5 font-sans">
            <li>
              <strong className="text-white">Platform Hub:</strong> In the "Top Active Routes" list, look at the status badge (<span className="text-emerald-400">Primary Active (A)</span> or <span className="text-amber-400">Backup Active (B)</span>).
            </li>
            <li>
              <strong className="text-white">Links &amp; Campaigns:</strong> The "Edge Status" column shows the active badge and a direct <span className="text-cyan-400">Visit Active Site</span> link.
            </li>
            <li>
              <strong className="text-white">Live Analytics:</strong> Review the "Auto-Fallback Failover Alert Stream" and the "Failover Target (A/B)" column.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => runSimulation('normal')}
            className="text-xs font-mono text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Primary (Healthy)</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition cursor-pointer w-full sm:w-auto"
            >
              Close
            </button>
            <button
              onClick={handleTestBrowserRedirect}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-mono font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <span>Open {shortLabel(route)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
