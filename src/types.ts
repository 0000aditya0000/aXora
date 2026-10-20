export type ViewMode = 'hub' | 'wizard' | 'analytics' | 'admin' | 'campaigns' | 'bulk' | 'settings' | 'qr';

export interface ShortRoute {
  id: string;
  shortCode: string;
  originalDestination: string; // Website A (Primary)
  fallbackDestination?: string; // Website B (Backup for Downtime / High Traffic)
  creator: string;
  creatorRole?: string;
  clicks: number;
  qrScans?: number;
  uniqueVisitors: number;
  ctr: number;
  shortUrl?: string;
  qrUrl?: string;
  edgeStatus: 'Active' | 'Flagged' | 'Disabled';
  threatReason?: 'Phishing' | 'Malware' | 'Spam' | 'None';
  threatSeverity?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  campaign: string;
  tags: string[];
  passcodeEnabled: boolean;
  passcode?: string;
  clickThreshold: number;
  ttl: string;
  iosTarget?: string;
  androidTarget?: string;
  desktopTarget?: string;
  createdAt: string;

  // Auto-Fallback & High-Traffic Failover Settings
  failoverEnabled?: boolean;
  maxLatencyThreshold?: number; // In milliseconds (e.g., 2000)
  trafficRateCap?: number; // Clicks/requests per minute (e.g., 500)
  httpFailoverCodes?: string[]; // e.g. ['500', '502', '503', '504', '429']
  activeRoutingTarget?: 'Primary' | 'Fallback'; // Current real-time edge target
  failoverReason?: string; // e.g., 'Origin 503 Unavailable', 'Latency 2450ms > 2000ms'
  failoverEventsCount?: number;
  healthStatus?: 'Healthy' | 'Degraded' | 'Down';
  currentLatencyMs?: number;
  currentTrafficRate?: number;
}

export interface FailoverLogEvent {
  id: string;
  routeId: string;
  shortCode: string;
  timestamp: string;
  reason: string;
  fromUrl: string;
  toUrl: string;
  statusCode?: number;
  latencyMs?: number;
}

export interface BlockedDomain {
  id: string;
  domain: string;
  category: 'Phishing' | 'Malware' | 'Spam' | 'Copyright';
  blockedDate: string;
  blockedAttempts: number;
}

export interface TrafficEvent {
  id: string;
  linkId: string;
  shortCode: string;
  kind: 'click' | 'scan';
  timestamp: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
  isBot: boolean;
}

export interface AnalyticsSummary {
  range: '24h' | '7d' | '30d';
  totals: {
    links: number;
    activeLinks: number;
    createdInRange: number;
    clicks: number;
    scans: number;
    uniqueVisitors: number;
    bots: number;
  };
  series: { bucket: string; clicks: number; scans: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  recentEvents: TrafficEvent[];
  topLinks: {
    shortCode: string;
    shortUrl: string;
    clicks: number;
    qrScans: number;
    uniqueVisitors: number;
  }[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  linksCount: number;
  totalClicks: number;
  goalProgress: number;
  status: 'Active' | 'Paused' | 'Completed';
}
