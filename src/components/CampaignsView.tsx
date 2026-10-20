import React, { useState } from 'react';
import { ShortRoute, Campaign } from '../types';
import { clickUrl, shortLabel } from '../lib/links';
import {
  Link2,
  FolderKanban,
  Search,
  Plus,
  Copy,
  ExternalLink,
  Tag,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Zap,
  QrCode,
} from 'lucide-react';

interface CampaignsViewProps {
  routes: ShortRoute[];
  campaigns: Campaign[];
  onOpenCreateModal: () => void;
  onCopyLink: (text: string) => void;
  onToggleStatus: (routeId: string, newStatus: 'Active' | 'Disabled') => void;
  onNotification: (msg: string) => void;
  onOpenFailoverSimulator?: (route: ShortRoute) => void;
  onOpenQrModal?: (route: ShortRoute) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  routes,
  campaigns,
  onOpenCreateModal,
  onCopyLink,
  onToggleStatus,
  onNotification,
  onOpenFailoverSimulator,
  onOpenQrModal,
}) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = routes.filter((r) => {
    const matchesCampaign = selectedCampaign === 'All' || r.campaign === selectedCampaign;
    const matchesSearch =
      r.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originalDestination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCampaign && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Links & Campaigns Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize destination routes into marketing initiatives and track global campaign delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white glow-orange-btn transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Short Link</span>
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {campaigns.map((cmp) => {
          const isSelected = selectedCampaign === cmp.name;
          return (
            <button
              key={cmp.id}
              onClick={() => setSelectedCampaign(isSelected ? 'All' : cmp.name)}
              className={`p-5 rounded-2xl glass-panel text-left transition cursor-pointer border ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-sans">{cmp.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {cmp.linksCount} links
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{cmp.description}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Target Goal</span>
                  <span className="text-emerald-400 font-semibold">{cmp.goalProgress}% Hit</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                    style={{ width: `${cmp.goalProgress}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by slug, destination, or tag..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090d16] text-xs text-white placeholder-slate-500 font-mono outline-none border border-white/10 focus:border-orange-500"
            />
          </div>

          <button
            onClick={() => {
              setSelectedCampaign('All');
              setSearchQuery('');
            }}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer whitespace-nowrap"
          >
            Reset Filters
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400 self-end sm:self-center">
          Showing <span className="text-white font-semibold">{filteredRoutes.length}</span> matching links
        </div>
      </div>

      {/* Routes List Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#090d16] text-slate-400 font-mono uppercase text-[11px] border-b border-white/10">
                <th className="py-3 px-4 font-semibold">Short Link</th>
                <th className="py-3 px-4 font-semibold">Target Destination (A / B)</th>
                <th className="py-3 px-4 font-semibold">Failover Target</th>
                <th className="py-3 px-4 font-semibold">Campaign & Tags</th>
                <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                <th className="py-3 px-4 font-semibold">Edge Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredRoutes.map((route) => {
                const isActive = route.edgeStatus === 'Active';
                return (
                  <tr key={route.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-orange-400" />
                        <button
                          onClick={() => onOpenFailoverSimulator && onOpenFailoverSimulator(route)}
                          className="hover:text-orange-400 transition cursor-pointer text-left font-mono"
                          title="Click to test single-link auto-failover (Website A vs Website B)"
                        >
                          {shortLabel(route)}
                        </button>
                        <button
                          onClick={() => onCopyLink(clickUrl(route))}
                          className="text-slate-500 hover:text-orange-400 transition cursor-pointer"
                          title="Copy link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
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

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{route.campaign}</div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {route.tags.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] font-mono text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-white font-semibold">
                      {route.clicks.toLocaleString()} clicks
                      <div className="text-[10px] text-orange-300 font-normal">{(route.qrScans || 0).toLocaleString()} scans</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {route.edgeStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenQrModal && (
                          <button
                            onClick={() => onOpenQrModal(route)}
                            className="px-2 py-1 rounded-lg text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition cursor-pointer text-[10px] font-mono flex items-center gap-1 font-semibold"
                            title="Generate & download scannable QR Code"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>QR</span>
                          </button>
                        )}
                        {onOpenFailoverSimulator && (
                          <button
                            onClick={() => onOpenFailoverSimulator(route)}
                            className="px-2 py-1 rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer text-[10px] font-mono flex items-center gap-1"
                            title="Simulate edge failover redirection"
                          >
                            <Zap className="w-3 h-3 text-orange-400" />
                            <span>Failover</span>
                          </button>
                        )}
                        <button
                          onClick={() => onToggleStatus(route.id, isActive ? 'Disabled' : 'Active')}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition cursor-pointer"
                        >
                          {isActive ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
