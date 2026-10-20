import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Key,
  Shield,
  Users,
  CheckCircle,
  Copy,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  onNotification: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNotification }) => {
  const [activeTab, setActiveTab] = useState<'domains' | 'api' | 'security' | 'team'>('domains');

  const [domains, setDomains] = useState([
    { domain: 'axora.to', type: 'Primary Edge Root', status: 'Active (Verified)', ssl: 'Wildcard RSA-4096' },
    { domain: 'links.acme.corp', type: 'Custom CNAME', status: 'Active (Verified)', ssl: 'Cloudflare Edge TLS 1.3' },
    { domain: 'go.pulseanalytics.cloud', type: 'Subdomain Routing', status: 'Pending DNS Propagation', ssl: 'Issuing...' },
  ]);

  const [newDomainInput, setNewDomainInput] = useState('');

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    setDomains([
      ...domains,
      {
        domain: newDomainInput.trim().toLowerCase(),
        type: 'Custom CNAME',
        status: 'Active (Verified)',
        ssl: 'TLS 1.3 Strict',
      },
    ]);
    onNotification(`Custom domain ${newDomainInput} added and CNAME validated!`);
    setNewDomainInput('');
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
          Workspace Settings & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure Anycast custom brand domains, API bearer credentials, Zero-Trust compliance, and team access.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'domains'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Branded Domains</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'api'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys & Webhooks</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Zero-Trust Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'team'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Roles (RBAC)</span>
        </button>
      </div>

      {/* Tab: Domains */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Custom Brand Domains</h2>
                <p className="text-xs text-slate-400">
                  Shorten URLs under your official corporate domain name for maximum brand trust and click-through rates.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDomain} className="flex gap-2">
              <input
                type="text"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                placeholder="e.g. link.yourbrand.com"
                className="flex-1 bg-[#090d16] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold glow-orange-btn text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Domain</span>
              </button>
            </form>

            <div className="divide-y divide-white/5 font-mono text-xs">
              {domains.map((d, i) => (
                <div key={i} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold">{d.domain}</div>
                      <div className="text-[11px] text-slate-500">{d.type} • SSL: {d.ssl}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.status.includes('Active')
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {d.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNotification(`DNS verification re-checked for ${d.domain}: Valid`)}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                      title="Verify DNS CNAME"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'api' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Production API Credentials</h2>
              <p className="text-xs text-slate-400">
                Use Bearer authentication in your CI/CD and CMS to dynamically mint, redirect, and inspect shortlinks.
              </p>
            </div>
            <button
              onClick={() => onNotification('Generated new API token')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              + Generate New Token
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Production Secret Key:</span>
              <span className="text-emerald-400">Active • Full Access</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121624] border border-white/5 font-mono text-xs">
              <span className="text-slate-200">ax_live_948f21e0ab29410cb8289ff10023a9b</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('ax_live_948f21e0ab29410cb8289ff10023a9b');
                  onNotification('Copied API Secret Key to clipboard');
                }}
                className="text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Zero-Trust & Protocol Policies</h2>
            <p className="text-xs text-slate-400">Global security enforcement applied across all 284 edge POPs.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">TLS 1.3 Strict Mode</div>
                <div className="text-slate-400">Refuse all legacy HTTP/1.0 and insecure cipher connections.</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Enforced
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Automated Honeypot Diversion</div>
                <div className="text-slate-400">Redirect suspected malicious bot traffic to isolation servers.</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Active
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">DNS Blackhole Cache Eviction</div>
                <div className="text-slate-400">Purge blacklisted domains from worldwide POP memory within 25ms.</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                Synchronized
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team */}
      {activeTab === 'team' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Team & Access Control (RBAC)</h2>
              <p className="text-xs text-slate-400">Manage operator permissions for creating, moderating, and evicting routes.</p>
            </div>
            <button
              onClick={() => onNotification('Invite link generated')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold glow-orange-btn text-white cursor-pointer"
            >
              + Invite Operator
            </button>
          </div>

          <div className="divide-y divide-white/5 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">aXora</div>
                <div className="text-slate-400 font-mono text-[11px]">admin@axora.corp</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">Platform Admin</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">sarah.v</div>
                <div className="text-slate-400 font-mono text-[11px]">sarah.v@acme.corp</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">Finance & VP</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">marketing.ops</div>
                <div className="text-slate-400 font-mono text-[11px]">marketing@acme.corp</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">Growth Lead</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
