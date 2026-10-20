import React, { useState, useEffect } from 'react';
import { ViewMode, ShortRoute, BlockedDomain, Campaign, FailoverLogEvent } from './types';
import {
  INITIAL_BLOCKED_DOMAINS,
  INITIAL_CAMPAIGNS,
  INITIAL_FAILOVER_LOGS,
} from './data/mockData';
import { createLink, importLinks, listLinks, updateLink } from './api';
import { shortLabel } from './lib/links';
import { Navigation } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { WizardView } from './components/WizardView';
import { AnalyticsView } from './components/AnalyticsView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { CampaignsView } from './components/CampaignsView';
import { BulkImportView } from './components/BulkImportView';
import { SettingsView } from './components/SettingsView';
import { QuickCreateModal } from './components/QuickCreateModal';
import { SearchModal } from './components/SearchModal';
import { FailoverSimulationModal } from './components/FailoverSimulationModal';
import { QRCodeModal } from './components/QRCodeModal';
import { QRGeneratorView } from './components/QRGeneratorView';
import HalftoneWordmarkFooter from './components/ui/halftone-wordmark-footer';
import { Check } from 'lucide-react';

const SAVED_LINKS_KEY = 'axora.links';

function readSavedLinks(): ShortRoute[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_LINKS_KEY) || '[]') as ShortRoute[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedLinks(links: ShortRoute[]) {
  try {
    localStorage.setItem(SAVED_LINKS_KEY, JSON.stringify(links));
  } catch {
    // Ignore private-mode storage failures. The server copy is still used when it exists.
  }
}

function mergeLinks(serverLinks: ShortRoute[], savedLinks: ShortRoute[]) {
  const byCode = new Map<string, ShortRoute>();
  for (const link of savedLinks) byCode.set(link.shortCode, link);
  for (const link of serverLinks) {
    const previous = byCode.get(link.shortCode);
    if (!previous) {
      byCode.set(link.shortCode, link);
      continue;
    }
    byCode.set(link.shortCode, {
      ...previous,
      ...link,
      clicks: Math.max(previous.clicks || 0, link.clicks || 0),
      qrScans: Math.max(previous.qrScans || 0, link.qrScans || 0),
      uniqueVisitors: Math.max(previous.uniqueVisitors || 0, link.uniqueVisitors || 0),
      shortUrl: link.shortUrl || previous.shortUrl,
      qrUrl: link.qrUrl || previous.qrUrl,
    });
  }
  return [...byCode.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('hub');
  const [routes, setRoutes] = useState<ShortRoute[]>(() => readSavedLinks());
  const [blockedDomains, setBlockedDomains] = useState<BlockedDomain[]>(INITIAL_BLOCKED_DOMAINS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [failoverLogs, setFailoverLogs] = useState<FailoverLogEvent[]>(INITIAL_FAILOVER_LOGS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeFailoverSimulatorRoute, setActiveFailoverSimulatorRoute] =
    useState<ShortRoute | null>(null);
  const [activeQrModalRoute, setActiveQrModalRoute] = useState<ShortRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const links = mergeLinks(await listLinks(), readSavedLinks());
        writeSavedLinks(links);
        if (!cancelled) setRoutes(links);
      } catch {
        // Keep the last successful list if the API is briefly unreachable.
      }
    };
    pull();
    const timer = window.setInterval(pull, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification(`Copied to clipboard: ${text}`);
  };

  const handleSaveRoute = async (newRouteData: Partial<ShortRoute>) => {
    try {
      const created = await createLink(newRouteData);
      setRoutes((prev) => {
        const next = [created, ...prev.filter((route) => route.shortCode !== created.shortCode)];
        writeSavedLinks(next);
        return next;
      });
      setCurrentView('campaigns');
      showNotification(`Short link ${shortLabel(created)} is live. Clicks and QR scans are tracked.`);
      return created;
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Could not create short link');
      return null;
    }
  };

  const handleUpdateRouteFailover = (
    routeId: string,
    target: 'Primary' | 'Fallback',
    health: 'Healthy' | 'Degraded' | 'Down',
    reason?: string,
    logEvent?: Omit<FailoverLogEvent, 'id' | 'timestamp'>
  ) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          return {
            ...r,
            activeRoutingTarget: target,
            healthStatus: health,
            failoverReason: reason,
            failoverEventsCount: (r.failoverEventsCount || 0) + (target === 'Fallback' ? 1 : 0),
          };
        }
        return r;
      })
    );

    if (activeFailoverSimulatorRoute?.id === routeId) {
      setActiveFailoverSimulatorRoute((prev) =>
        prev
          ? {
              ...prev,
              activeRoutingTarget: target,
              healthStatus: health,
              failoverReason: reason,
            }
          : null
      );
    }

    if (logEvent) {
      const newLog: FailoverLogEvent = {
        id: `fail_${Date.now()}`,
        timestamp: 'Just now',
        ...logEvent,
      };
      setFailoverLogs((prev) => [newLog, ...prev]);
    }

    const route = routes.find((item) => item.id === routeId);
    if (route) {
      updateLink(route.shortCode, {
        activeRoutingTarget: target,
        healthStatus: health,
        failoverReason: reason,
        recordFailover: target === 'Fallback',
      })
        .then((updated) => {
          setRoutes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        })
        .catch((error) => {
          showNotification(error instanceof Error ? error.message : 'Could not update failover');
        });
    }
  };

  const handleToggleRouteStatus = (routeId: string, newStatus: 'Active' | 'Disabled') => {
    const route = routes.find((item) => item.id === routeId);
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, edgeStatus: newStatus } : r))
    );
    if (!route) return;
    updateLink(route.shortCode, { edgeStatus: newStatus })
      .then((updated) => {
        setRoutes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showNotification(`Route status updated to ${newStatus}`);
      })
      .catch((error) => {
        showNotification(error instanceof Error ? error.message : 'Could not update link status');
      });
  };

  const handleAddBlockedDomain = (
    domain: string,
    category: 'Phishing' | 'Malware' | 'Spam' | 'Copyright'
  ) => {
    const newBlocked: BlockedDomain = {
      id: `dom_${Date.now()}`,
      domain,
      category,
      blockedDate: 'Just Now',
      blockedAttempts: 0,
    };
    setBlockedDomains((prev) => [newBlocked, ...prev]);
    showNotification(`Domain ${domain} blackholed and purged from edge routing caches.`);
  };

  const handleRemoveBlockedDomain = (domainId: string) => {
    setBlockedDomains((prev) => prev.filter((d) => d.id !== domainId));
    showNotification('Domain removed from quarantine blocklist.');
  };

  const handleImportRoutes = (newItems: Partial<ShortRoute>[]) => {
    const fullItems: ShortRoute[] = newItems.map((item, index) => ({
      id: `lnk_bulk_${Date.now()}_${index}`,
      shortCode: item.shortCode || `bulk-${index}`,
      originalDestination: item.originalDestination || 'https://example.com',
      fallbackDestination: item.fallbackDestination,
      failoverEnabled: true,
      maxLatencyThreshold: 2000,
      trafficRateCap: 500,
      httpFailoverCodes: ['500', '502', '503', '504', '429'],
      activeRoutingTarget: 'Primary',
      healthStatus: 'Healthy',
      creator: 'aXora',
      creatorRole: 'Admin',
      clicks: 0,
      uniqueVisitors: 0,
      ctr: 0,
      edgeStatus: 'Active',
      campaign: item.campaign || 'Q3 Global Growth',
      tags: item.tags || ['#bulk-import'],
      passcodeEnabled: false,
      clickThreshold: 50000,
      ttl: '30d',
      createdAt: new Date().toISOString(),
    }));

    importLinks(fullItems)
      .then((result) => {
        setRoutes((prev) => {
          const createdIds = new Set(result.created.map((link) => link.id));
          return [...result.created, ...prev.filter((link) => !createdIds.has(link.id))];
        });
        if (result.errors.length) {
          showNotification(
            `Imported ${result.created.length} links. ${result.errors.length} could not be saved.`
          );
        }
      })
      .catch((error) => {
        showNotification(error instanceof Error ? error.message : 'Bulk import failed');
      });
  };

  const flaggedCount = routes.filter((r) => r.edgeStatus === 'Flagged').length;

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Navigation Bars (Sidebar & Sticky Top Header) */}
      <Navigation
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreateModal={() => setQuickCreateOpen(true)}
        onOpenSearchModal={() => setSearchOpen(true)}
        flaggedCount={flaggedCount}
      />

      {/* Main Content Area (Offset for desktop left sidebar) */}
      <main className="flex-1 w-full lg:pl-72 transition-all">
        {currentView === 'hub' && (
          <OverviewView
            routes={routes}
            onSwitchView={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCreateModal={() => setQuickCreateOpen(true)}
            onInspectThreat={() => setCurrentView('admin')}
            onCopyLink={handleCopyLink}
            onOpenFailoverSimulator={(route) => setActiveFailoverSimulatorRoute(route)}
            onOpenQrModal={(route) => setActiveQrModalRoute(route)}
            onSaveRoute={handleSaveRoute}
            onNotification={showNotification}
          />
        )}

        {currentView === 'qr' && (
          <QRGeneratorView
            routes={routes}
            onNotification={showNotification}
            onCopyLink={handleCopyLink}
            onOpenCreateModal={() => setQuickCreateOpen(true)}
          />
        )}

        {currentView === 'wizard' && (
          <WizardView
            onSaveRoute={handleSaveRoute}
            onNotification={showNotification}
            onCancel={() => setCurrentView('hub')}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            routes={routes}
            failoverLogs={failoverLogs}
            onCopyLink={handleCopyLink}
            onInspectThreat={() => setCurrentView('admin')}
            onNotification={showNotification}
            onOpenFailoverSimulator={(route) => setActiveFailoverSimulatorRoute(route)}
          />
        )}

        {currentView === 'admin' && (
          <AdminConsoleView
            routes={routes}
            blockedDomains={blockedDomains}
            onToggleRouteStatus={handleToggleRouteStatus}
            onAddBlockedDomain={handleAddBlockedDomain}
            onRemoveBlockedDomain={handleRemoveBlockedDomain}
            onCopyLink={handleCopyLink}
            onNotification={showNotification}
            onOpenFailoverSimulator={(route) => setActiveFailoverSimulatorRoute(route)}
          />
        )}

        {currentView === 'campaigns' && (
          <CampaignsView
            routes={routes}
            campaigns={campaigns}
            onOpenCreateModal={() => setQuickCreateOpen(true)}
            onCopyLink={handleCopyLink}
            onToggleStatus={handleToggleRouteStatus}
            onNotification={showNotification}
            onOpenFailoverSimulator={(route) => setActiveFailoverSimulatorRoute(route)}
            onOpenQrModal={(route) => setActiveQrModalRoute(route)}
          />
        )}

        {currentView === 'bulk' && (
          <BulkImportView
            onImportRoutes={handleImportRoutes}
            onNotification={showNotification}
            onSwitchView={(v) => setCurrentView(v)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView onNotification={showNotification} />
        )}

        {/* Halftone Wordmark Copyright & Attribution Footer for aXora */}
        <HalftoneWordmarkFooter
          wordmark="axora"
          label="aXora Link Intelligence"
          meta="© 2026 aXora Inc. · Anycast CDN · Auto-Failover Protection"
          preset="ember"
          height="500px"
          columns={[
            {
              title: 'Platform',
              links: [
                {
                  label: 'Overview',
                  href: '#overview',
                  onClick: () => {
                    setCurrentView('hub');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Link Wizard',
                  href: '#wizard',
                  onClick: () => {
                    setCurrentView('wizard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Live Analytics',
                  href: '#analytics',
                  onClick: () => {
                    setCurrentView('analytics');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Admin Console',
                  href: '#admin',
                  onClick: () => {
                    setCurrentView('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Bulk Import',
                  href: '#bulk',
                  onClick: () => {
                    setCurrentView('bulk');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
              ],
            },
            {
              title: 'Edge Engine',
              links: [
                {
                  label: '284 Anycast POPs',
                  href: '#edge',
                  onClick: () => {
                    setCurrentView('analytics');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Zero-Trust Shield',
                  href: '#security',
                  onClick: () => {
                    setCurrentView('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Dynamic Vector QR',
                  href: '#qr',
                  onClick: () => {
                    setCurrentView('wizard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Campaign Hub',
                  href: '#campaigns',
                  onClick: () => {
                    setCurrentView('campaigns');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                {
                  label: 'Failover Protection SLA',
                  href: '#sla',
                  onClick: () => {
                    setCurrentView('settings');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
              ],
            },
            {
              title: 'Attribution',
              links: [
                {
                  label: 'Settings & Domains',
                  href: '#settings',
                  onClick: () => {
                    setCurrentView('settings');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
                },
                { label: 'SOC2 Type II Certified', href: '#compliance' },
                { label: 'Privacy Policy', href: '#privacy' },
                { label: 'secops@axora.io', href: 'mailto:secops@axora.io' },
              ],
            },
          ]}
        />
      </main>

      {/* Failover & Redirection Testing Simulation Modal */}
      <FailoverSimulationModal
        isOpen={!!activeFailoverSimulatorRoute}
        onClose={() => setActiveFailoverSimulatorRoute(null)}
        route={activeFailoverSimulatorRoute}
        onUpdateRouteFailover={handleUpdateRouteFailover}
        onNotification={showNotification}
      />

      {/* Quick Create Link Modal */}
      <QuickCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        onSaveRoute={handleSaveRoute}
        onNotification={showNotification}
        onOpenQrModal={(route) => setActiveQrModalRoute(route)}
      />

      {/* Scannable QR Code Modal */}
      <QRCodeModal
        isOpen={!!activeQrModalRoute}
        onClose={() => setActiveQrModalRoute(null)}
        route={activeQrModalRoute}
        onNotification={showNotification}
      />

      {/* Global Command Palette / Search Modal (⌘K) */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        routes={routes}
        blockedDomains={blockedDomains}
        onSelectView={(v) => setCurrentView(v)}
        onCopyLink={handleCopyLink}
      />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-glow border border-orange-500/40 text-xs font-mono text-orange-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
