import React, { useEffect, useState } from 'react';
import { Search, Link2, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { ShortRoute, BlockedDomain, ViewMode } from '../types';
import { clickUrl, shortLabel } from '../lib/links';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: ShortRoute[];
  blockedDomains: BlockedDomain[];
  onSelectView: (view: ViewMode) => void;
  onCopyLink: (url: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  routes,
  blockedDomains,
  onSelectView,
  onCopyLink,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredRoutes = routes.filter(
    (r) =>
      r.shortCode.toLowerCase().includes(query.toLowerCase()) ||
      r.originalDestination.toLowerCase().includes(query.toLowerCase()) ||
      r.campaign.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDomains = blockedDomains.filter((d) =>
    d.domain.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden text-left flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0a0e17]">
          <Search className="w-5 h-5 text-orange-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all routes, destinations, campaigns, blocklist..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 font-mono outline-none"
          />
          <kbd className="hidden sm:inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-slate-400">
            ESC
          </kbd>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4">
          {/* Quick views jump */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1">
              Modules & Consoles
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1">
              {[
                { label: 'Platform Hub', view: 'hub' as ViewMode },
                { label: 'Link Wizard', view: 'wizard' as ViewMode },
                { label: 'Live Analytics', view: 'analytics' as ViewMode },
                { label: 'Admin Console', view: 'admin' as ViewMode },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    onSelectView(item.view);
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 text-left transition font-medium cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Matching Routes */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1">
              Matching Short Routes ({filteredRoutes.length})
            </div>
            <div className="space-y-1">
              {filteredRoutes.slice(0, 6).map((route) => (
                <div
                  key={route.id}
                  onClick={() => {
                    onCopyLink(clickUrl(route));
                    onSelectView('campaigns');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Link2 className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-semibold text-white group-hover:text-orange-300">
                        {shortLabel(route)}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {route.originalDestination}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 shrink-0 pl-2">
                    {route.clicks.toLocaleString()} clicks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Domains */}
          {filteredDomains.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1">
                Quarantined Domains ({filteredDomains.length})
              </div>
              <div className="space-y-1">
                {filteredDomains.slice(0, 4).map((dom) => (
                  <div
                    key={dom.id}
                    onClick={() => {
                      onSelectView('admin');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-red-500/10 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="font-mono text-xs text-white">{dom.domain}</span>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                      {dom.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
