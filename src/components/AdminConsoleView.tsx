import React, { useState } from 'react';
import { ShortRoute, BlockedDomain } from '../types';
import { clickUrl, shortLabel } from '../lib/links';
import {
  ShieldAlert,
  Server,
  Zap,
  AlertOctagon,
  Search,
  Filter,
  Download,
  PlusCircle,
  Copy,
  Trash2,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AdminConsoleViewProps {
  routes: ShortRoute[];
  blockedDomains: BlockedDomain[];
  onToggleRouteStatus: (routeId: string, newStatus: 'Active' | 'Disabled') => void;
  onAddBlockedDomain: (domain: string, category: 'Phishing' | 'Malware' | 'Spam' | 'Copyright') => void;
  onRemoveBlockedDomain: (domainId: string) => void;
  onCopyLink: (text: string) => void;
  onNotification: (msg: string) => void;
  onOpenFailoverSimulator?: (route: ShortRoute) => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  routes,
  blockedDomains,
  onToggleRouteStatus,
  onAddBlockedDomain,
  onRemoveBlockedDomain,
  onCopyLink,
  onNotification,
  onOpenFailoverSimulator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'active' | 'flagged' | 'disabled'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState('All');
  const [showDeactivationBanner, setShowDeactivationBanner] = useState(true);

  // New Domain form
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<'Phishing' | 'Malware' | 'Spam' | 'Copyright'>('Phishing');

  // Audit Logs modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<ShortRoute | null>(null);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [policyRuleName, setPolicyRuleName] = useState('');

  const handleAddDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!d) {
      onNotification('Please enter a valid domain name');
      return;
    }
    onAddBlockedDomain(d, newCategory);
    setNewDomain('');
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originalDestination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.creator.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusTab === 'all' ||
      (selectedStatusTab === 'active' && r.edgeStatus === 'Active') ||
      (selectedStatusTab === 'flagged' && r.edgeStatus === 'Flagged') ||
      (selectedStatusTab === 'disabled' && r.edgeStatus === 'Disabled');

    const matchesCampaign = selectedCampaign === 'All' || r.campaign === selectedCampaign;

    return matchesSearch && matchesStatus && matchesCampaign;
  });

  const activeCount = routes.filter((r) => r.edgeStatus === 'Active').length;
  const flaggedCount = routes.filter((r) => r.edgeStatus === 'Flagged').length;
  const disabledCount = routes.filter((r) => r.edgeStatus === 'Disabled').length;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Command Strip & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-orange-400 font-semibold">
              SEC-OPS // EDGE MATRIX
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              EDGE POLICY SHIELD • Zero-Trust v4 Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Governance & Security Console
          </h1>
        </div>

        {/* Real-time Edge Telemetry Chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0f1422] border border-white/10 shadow-sm">
            <Server className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Routers</span>
              <span className="font-mono text-xs font-semibold text-white">148 Nodes</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0f1422] border border-white/10 shadow-sm">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Avg Propagation</span>
              <span className="font-mono text-xs font-semibold text-white">18ms</span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0f1422] border border-white/10 shadow-sm">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Quarantine Rate</span>
              <span className="font-mono text-xs font-semibold text-red-400">0.52%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Inline Warning Banner */}
      {showDeactivationBanner && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-[#181014] to-[#0f1422] border border-red-500/30 shadow-md">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Confirm Deactivation in Progress</span>
              <p className="text-xs text-slate-300">
                Redirects will terminate immediately across all edge CDNs. Telemetry logging stays preserved for compliance audit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => setShowDeactivationBanner(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDeactivationBanner(false);
                onNotification('Quarantined routes evicted from CDN cache.');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              Evict & Disable Link
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter & Batch Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-[#0a0e17] p-4 rounded-2xl border border-white/10 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-96 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search short code, destination URL, or creator email..."
              className="w-full pl-9 pr-12 py-2 rounded-xl bg-[#121624] text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 font-mono border border-white/10"
            />
            <kbd className="absolute right-3 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
              ⌘K
            </kbd>
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full bg-[#121624] text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="All">All Campaigns (System-wide)</option>
              <option value="Q3 Global Growth">Q3 Global Growth</option>
              <option value="affiliate-partner-04">affiliate-partner-04</option>
              <option value="Product Launch 2025">Product Launch 2025</option>
              <option value="Internal Executive Memos">Internal Executive Memos</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
          <div className="flex items-center bg-[#121624] p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'all'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All: {routes.length}
            </button>
            <button
              onClick={() => setSelectedStatusTab('active')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'active'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active: {activeCount}
            </button>
            <button
              onClick={() => setSelectedStatusTab('flagged')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedStatusTab === 'flagged'
                  ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/30'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Flagged: {flaggedCount}
            </button>
            <button
              onClick={() => setSelectedStatusTab('disabled')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                selectedStatusTab === 'disabled'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Disabled: {disabledCount}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPolicyModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
              <span>+ Add Policy Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Administrative Workspace: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Link Governance Ledger (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-4 bg-[#0a0e17] p-5 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Active Ingress Policy Enforcement</h2>
                <span className="text-[11px] text-slate-400">
                  Live deep-packet inspection logs synchronized via Cloudflare Workers
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-white/5 text-slate-400 font-mono text-[11px]">
              Page 1 of 1
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121624] text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                  <th className="py-3 px-3.5 font-semibold">Short Code</th>
                  <th className="py-3 px-3.5 font-semibold">Destination (A / B)</th>
                  <th className="py-3 px-3.5 font-semibold">Failover Target</th>
                  <th className="py-3 px-3.5 font-semibold">Creator</th>
                  <th className="py-3 px-3.5 font-semibold">Clicks</th>
                  <th className="py-3 px-3.5 font-semibold">Threat State</th>
                  <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredRoutes.map((route) => {
                  const isFlagged = route.edgeStatus === 'Flagged';
                  const isDisabled = route.edgeStatus === 'Disabled';
                  return (
                    <tr
                      key={route.id}
                      className={`transition-colors group ${
                        isFlagged
                          ? 'bg-red-500/[0.04] hover:bg-red-500/[0.08]'
                          : isDisabled
                          ? 'opacity-85 hover:bg-white/[0.02]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-semibold ${
                              isDisabled ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {shortLabel(route)}
                          </span>
                          <button
                            onClick={() => onCopyLink(clickUrl(route))}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-orange-400 transition"
                            title="Copy link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {route.threatSeverity ? (
                          <span className="font-mono text-[10px] text-red-400 font-bold">
                            {route.threatSeverity} SEVERITY
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400">
                            {route.campaign}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5 max-w-xs">
                        <div className="font-mono text-[11px] text-slate-300 truncate" title={route.originalDestination}>
                          <span className="text-emerald-400 font-semibold mr-1">A:</span>
                          {route.originalDestination}
                        </div>
                        {route.fallbackDestination && (
                          <div className="font-mono text-[10px] text-amber-300/80 truncate mt-0.5" title={route.fallbackDestination}>
                            <span className="text-amber-400 font-semibold mr-1">B:</span>
                            {route.fallbackDestination}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                              route.activeRoutingTarget === 'Fallback'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                route.activeRoutingTarget === 'Fallback'
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-emerald-400'
                              }`}
                            />
                            {route.activeRoutingTarget === 'Fallback' ? 'Backup (B)' : 'Primary (A)'}
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
                            <span>Visit Active</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span className="text-white text-xs">{route.creator}</span>
                        <div className="font-mono text-[10px] text-slate-400">
                          {route.creatorRole || 'Standard User'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 font-mono">
                        <span className="text-white font-medium">{route.clicks.toLocaleString()} hits</span>
                        <div className="w-16 h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                          <div
                            className={`h-full ${isFlagged ? 'bg-red-500' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, (route.clicks / 50000) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                            isFlagged
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : isDisabled
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFlagged ? 'bg-red-500 animate-pulse' : isDisabled ? 'bg-slate-500' : 'bg-emerald-400'
                            }`}
                          />
                          {route.threatReason ? `Flagged (${route.threatReason})` : route.edgeStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {onOpenFailoverSimulator && (
                            <button
                              onClick={() => onOpenFailoverSimulator(route)}
                              className="px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-semibold border border-orange-500/20 transition cursor-pointer flex items-center gap-1"
                              title="Test Failover Redirection"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Failover</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedAuditLog(route)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                          >
                            Audit Logs
                          </button>

                          {isDisabled ? (
                            <button
                              onClick={() => onToggleRouteStatus(route.id, 'Active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggleRouteStatus(route.id, 'Disabled')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                isFlagged
                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                  : 'bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300'
                              }`}
                            >
                              Disable Link
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination & Stream Micro-Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3 bg-[#121624] p-3 rounded-xl border border-white/5 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live audit logging active • 0 unhandled security alerts</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <button disabled className="p-1 rounded bg-white/5 text-slate-500 cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-white font-semibold">1</span>
              <button disabled className="p-1 rounded bg-white/5 text-slate-500 cursor-not-allowed">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Global Domain Blocklist & Blackhole Engine (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-4 bg-[#0a0e17] p-5 rounded-2xl border border-white/10 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center font-bold">
                  🚫
                </div>
                <h2 className="text-sm font-bold text-white">Global Domain Blocklist</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[11px] font-semibold border border-red-500/30">
                {blockedDomains.length} Active Domains
              </span>
            </div>

            {/* Add Domain Input Form */}
            <form onSubmit={handleAddDomainSubmit} className="flex flex-col gap-3 bg-[#121624] p-3.5 rounded-xl border border-white/5">
              <span className="text-xs font-semibold text-white">Blackhole Target Domain</span>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. malicious-redirect.xyz"
                className="w-full px-3 py-2 rounded-xl bg-[#090d16] text-white placeholder-slate-500 font-mono text-xs focus:border-orange-500 outline-none border border-white/10"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#090d16] text-slate-200 text-xs border border-white/10 outline-none cursor-pointer"
                >
                  <option value="Phishing">Phishing</option>
                  <option value="Malware">Malware</option>
                  <option value="Spam">Spam</option>
                  <option value="Copyright">Copyright</option>
                </select>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl glow-orange-btn text-white text-xs font-semibold transition cursor-pointer"
                >
                  <span>+ Add to Blocklist</span>
                </button>
              </div>

              <p className="font-mono text-[11px] text-slate-400 leading-relaxed">
                Changes immediately evict any queued routing tables across globally distributed ingress nodes.
              </p>
            </form>

            {/* Blocked Domains Ledger */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-1">
                Enforced Takedown Records
              </span>

              {blockedDomains.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121624] border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-white truncate">{item.domain}</span>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 mt-0.5">
                      <span className="text-red-400 font-medium">{item.category}</span>
                      <span>•</span>
                      <span>Blocked {item.blockedDate}</span>
                      <span>•</span>
                      <span className="text-slate-200">{item.blockedAttempts.toLocaleString()} hits</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveBlockedDomain(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition cursor-pointer shrink-0"
                    title="Remove block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Sync Status Card */}
          <div className="p-4 rounded-2xl bg-[#0a0e17] border border-white/10 flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  DNS Blackhole Propagation Active
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">100% HEALTH</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#121624] border border-white/5 flex flex-col">
                <span className="text-slate-400 text-[10px]">Cloudflare Sync</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Sync
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121624] border border-white/5 flex flex-col">
                <span className="text-slate-400 text-[10px]">Fastly Edge VCL</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> In Sync
                </span>
              </div>
            </div>

            <p className="font-mono text-[11px] text-slate-400 flex items-center gap-1 pt-1">
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              Instant edge cache eviction enabled via Anycast broadcast.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Inspection Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/15 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Security Audit Log Event</h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#090d16] border border-white/10 space-y-1">
                <span className="text-slate-500">Route Alias:</span>
                <div className="text-orange-400 font-bold">{shortLabel(selectedAuditLog)}</div>
                <span className="text-slate-500 mt-2 block">Origin Destination:</span>
                <div className="text-slate-200 truncate">{selectedAuditLog.originalDestination}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121624] border border-white/5 space-y-1.5">
                <div className="text-slate-400 font-semibold">Security Metadata:</div>
                <div className="text-slate-300">Creator: {selectedAuditLog.creator}</div>
                <div className="text-slate-300">Role: {selectedAuditLog.creatorRole || 'Standard'}</div>
                <div className="text-slate-300">Threat Reason: {selectedAuditLog.threatReason || 'None (Clean)'}</div>
                <div className="text-slate-300">Total Traffic Processed: {selectedAuditLog.clicks.toLocaleString()} requests</div>
                <div className="text-slate-300">Last Telemetry Probe: 18ms ago • Node: ord-01</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Policy Rule Modal */}
      {showAddPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-orange-500/30 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Create Zero-Trust Policy Rule</h3>
              </div>
              <button
                onClick={() => setShowAddPolicyModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rule Identifier</label>
                <input
                  type="text"
                  value={policyRuleName}
                  onChange={(e) => setPolicyRuleName(e.target.value)}
                  placeholder="e.g. Quarantine High-Velocity Redirects"
                  className="w-full bg-[#090d16] border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Action</label>
                <select className="w-full bg-[#090d16] border border-white/15 rounded-xl px-3 py-2 text-white outline-none">
                  <option>Automatic Honeypot Diversion</option>
                  <option>Force Passcode Interstitial</option>
                  <option>Instant Edge Cache Eviction</option>
                  <option>Challenge with Cloudflare Turnstile</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trigger Condition</label>
                <input
                  type="text"
                  defaultValue="request_rate > 250/sec OR threat_intel == 'malicious'"
                  className="w-full bg-[#090d16] border border-white/15 rounded-xl px-3 py-2 text-cyan-300 font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddPolicyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddPolicyModal(false);
                  onNotification(`Policy rule "${policyRuleName || 'Custom Rule'}" activated across 284 POPs`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold glow-orange-btn text-white"
              >
                Deploy Policy Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
