import React, { useState } from 'react';
import { ViewMode } from '../types';
import {
  Link2,
  LayoutGrid,
  PlusCircle,
  Activity,
  ShieldAlert,
  Upload,
  Settings as SettingsIcon,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  QrCode,
  FolderKanban,
} from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenCreateModal: () => void;
  onOpenSearchModal: () => void;
  flaggedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  onOpenCreateModal,
  onOpenSearchModal,
  flaggedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState('Acme Enterprise • prod-edge');

  const navItems = [
    { id: 'hub' as ViewMode, label: 'Link Shortener', icon: Link2, badge: null },
    { id: 'qr' as ViewMode, label: 'QR Code Generator', icon: QrCode, badge: 'New' },
    { id: 'campaigns' as ViewMode, label: 'My Links & Failover', icon: FolderKanban, badge: null },
    { id: 'analytics' as ViewMode, label: 'Live Analytics', icon: Activity, badge: null },
    { id: 'settings' as ViewMode, label: 'Settings', icon: SettingsIcon, badge: null },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (FOR EXPANDED CONSOLE VIEW) ================= */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-[#0a0e17] border-r border-white/10 z-40 flex-col justify-between shadow-2xl">
        <div className="flex flex-col">
          {/* Logo & Version Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-white/5">
            <button
              onClick={() => onSelectView('hub')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-indigo-500 p-[1.5px] shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition">
                <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-orange-400 group-hover:scale-110 transition duration-200" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">aXora</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  v2.4
                </span>
              </div>
            </button>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected to Edge Layer 4" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 p-3 pt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-300 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        item.id === 'admin'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Edge Telemetry Footer Widget */}
        <div className="p-3.5 m-3 rounded-xl bg-[#121624] border border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Edge Telemetry</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] gap-1 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live
            </span>
          </div>
          <p className="font-mono text-xs text-white truncate">148 Anycast Nodes • 18ms ping</p>
          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>All systems operational</span>
          </div>
        </div>
      </aside>

      {/* ================= TOP HEADER (STICKY) ================= */}
      <header className="sticky top-0 z-30 w-full lg:pl-72 bg-[#090d16]/85 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Workspace selector */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile logo when sidebar is hidden */}
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-lg font-bold text-white">aXora</span>
              <span className="px-1 py-0.2 rounded text-[10px] font-mono bg-orange-500/10 text-orange-400">v2.4</span>
            </div>

            {/* Workspace selector */}
            <div className="relative">
              <button
                onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121624] hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-100">{selectedWorkspace}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {workspaceDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl bg-[#0f1422] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-mono uppercase text-slate-400 px-2 py-1">Switch Workspace</div>
                  <button
                    onClick={() => {
                      setSelectedWorkspace('Acme Enterprise • prod-edge');
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-xs text-white flex items-center justify-between"
                  >
                    <span>Acme Enterprise (prod-edge)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWorkspace('Acme Staging • test-cluster');
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-300 flex items-center justify-between"
                  >
                    <span>Acme Staging (test-cluster)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWorkspace('Growth Marketing • sandbox');
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-300 flex items-center justify-between"
                  >
                    <span>Growth Marketing (sandbox)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick jump navigation for tablet/hub view */}
            <div className="hidden xl:flex items-center space-x-1 pl-3 text-xs font-medium">
              <button
                onClick={() => onSelectView('hub')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'hub' ? 'text-orange-400 bg-orange-500/10 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Platform Hub
              </button>
              <button
                onClick={() => onSelectView('wizard')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'wizard' ? 'text-orange-400 bg-orange-500/10 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Link Wizard
              </button>
              <button
                onClick={() => onSelectView('analytics')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'analytics' ? 'text-orange-400 bg-orange-500/10 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Analytics
              </button>
              <button
                onClick={() => onSelectView('admin')}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  currentView === 'admin' ? 'text-orange-400 bg-orange-500/10 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin & Blocklist
              </button>
            </div>
          </div>

          {/* Right: Search, Create Link CTA, Notifications & User Avatar */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={onOpenSearchModal}
              className="flex items-center gap-2.5 bg-[#121624] hover:bg-white/10 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 border border-white/10 transition text-xs cursor-pointer"
              title="Search links, domains, campaigns (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-sans">Search links, domains...</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">⌘K</kbd>
            </button>

            {/* Glowing CTA Button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white glow-orange-btn transition duration-200 active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span className="whitespace-nowrap">Create Short Link</span>
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {flaggedCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                    {flaggedCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0f1422] border border-white/15 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <span className="text-xs font-bold text-white">Edge Security Alerts</span>
                    <span className="text-[10px] font-mono text-orange-400">Zero-Trust Active</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-xs text-red-200">
                      <div className="font-semibold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Quarantine Triggered
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Suspicious redirect on <code className="text-red-300">crypto-airdrop-win</code> was auto-diverted.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200">
                      <div className="font-semibold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Anycast Sync Complete
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        All 284 Cloudflare POPs updated in 18ms.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onSelectView('admin');
                    }}
                    className="w-full mt-3 py-1.5 rounded-lg text-center text-xs font-medium text-orange-400 hover:text-orange-300 hover:bg-white/5 transition"
                  >
                    View Audit Logs in Console →
                  </button>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 border-l border-white/10">
              <div className="w-8 h-8 rounded-full ring-2 ring-orange-500/40 bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-mono text-xs font-semibold text-orange-300">
                AX
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight font-sans">aXora</span>
                <span className="text-[10px] text-slate-400 leading-tight">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">aXora Platform</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-2 py-6 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-orange-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-slate-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCreateModal();
              }}
              className="w-full py-3 rounded-xl glow-orange-btn text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Short Link</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
