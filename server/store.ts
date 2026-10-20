import fs from 'fs';
import path from 'path';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export type EdgeStatus = 'Active' | 'Flagged' | 'Disabled';
export type HealthStatus = 'Healthy' | 'Degraded' | 'Down';
export type RoutingTarget = 'Primary' | 'Fallback';
export type EventKind = 'click' | 'scan';

export interface LinkRecord {
  id: string;
  shortCode: string;
  originalDestination: string;
  fallbackDestination?: string;
  creator: string;
  creatorRole?: string;
  edgeStatus: EdgeStatus;
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
  failoverEnabled?: boolean;
  maxLatencyThreshold?: number;
  trafficRateCap?: number;
  httpFailoverCodes?: string[];
  activeRoutingTarget?: RoutingTarget;
  failoverReason?: string;
  failoverEventsCount?: number;
  healthStatus?: HealthStatus;
}

export interface EventRecord {
  id: string;
  linkId: string;
  shortCode: string;
  kind: EventKind;
  timestamp: string;
  visitorId: string;
  referrer: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  isBot: boolean;
}

interface StoreData {
  links: LinkRecord[];
  events: EventRecord[];
}

const DATA_PATH = path.resolve(process.cwd(), 'data', 'store.json');
const MAX_EVENTS = 20000;
const CODE_RE = /^[a-z0-9](?:[a-z0-9_-]{0,39})$/;

let writeQueue: Promise<unknown> = Promise.resolve();

function emptyStore(): StoreData {
  return { links: [], events: [] };
}

function readStore(): StoreData {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreData;
    return {
      links: Array.isArray(parsed.links) ? parsed.links : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(data: StoreData) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_PATH);
}

function mutate<T>(fn: (store: StoreData) => T): Promise<T> {
  const run = writeQueue.then(() => {
    const store = readStore();
    const result = fn(store);
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(store.events.length - MAX_EVENTS);
    }
    writeStore(store);
    return result;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function normalizeDestination(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new HttpError(400, 'Destination URL is missing or too long');
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new HttpError(400, 'Destination URL is not valid');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(400, 'Only http and https destinations are allowed');
  }
  if (!url.hostname || url.hostname === '.') {
    throw new HttpError(400, 'Destination URL needs a hostname');
  }
  return url.toString();
}

export function normalizeCode(input: string | undefined): string {
  const code = (input || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!CODE_RE.test(code)) {
    throw new HttpError(400, 'Short code must be 1–40 characters: letters, numbers, hyphen, or underscore');
  }
  return code;
}

export function generateCode(len = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(len);
  let result = '';
  for (let i = 0; i < len; i++) result += chars[bytes[i] % chars.length];
  return result;
}

export function passwordsMatch(stored: string, given: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function classifyClient(userAgent: string, referrerHeader: string) {
  const ua = userAgent || '';
  const isBot = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|preview|headless|curl|wget/i.test(
    ua
  );
  let device = 'desktop';
  if (/ipad|tablet|playbook|silk/i.test(ua)) device = 'tablet';
  else if (/mobile|iphone|ipod|android|phone/i.test(ua)) device = 'mobile';
  else if (!ua) device = 'unknown';

  let browser = 'Other';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (isBot) browser = 'Bot';

  let os = 'Other';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let referrer = 'direct';
  if (referrerHeader) {
    try {
      referrer = new URL(referrerHeader).hostname || 'direct';
    } catch {
      referrer = 'direct';
    }
  }

  return { isBot, device, browser, os, referrer };
}

export function visitorKey(ip: string, userAgent: string, cookieId?: string): string {
  if (cookieId && /^[A-Za-z0-9_-]{8,80}$/.test(cookieId)) return cookieId;
  return createHash('sha256').update(`${ip}|${userAgent}`).digest('base64url').slice(0, 22);
}

function optionalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return normalizeDestination(value);
}

export interface LinkInput {
  shortCode?: string;
  originalDestination?: string;
  fallbackDestination?: string;
  campaign?: string;
  tags?: string[];
  passcodeEnabled?: boolean;
  passcode?: string;
  clickThreshold?: number;
  ttl?: string;
  iosTarget?: string;
  androidTarget?: string;
  desktopTarget?: string;
  failoverEnabled?: boolean;
  maxLatencyThreshold?: number;
  trafficRateCap?: number;
  httpFailoverCodes?: string[];
  edgeStatus?: EdgeStatus;
  creator?: string;
  creatorRole?: string;
}

function buildLink(input: LinkInput, store: StoreData): LinkRecord {
  const destination = normalizeDestination(input.originalDestination || '');
  let code = input.shortCode ? normalizeCode(input.shortCode) : generateCode(6);
  if (!input.shortCode) {
    while (store.links.some((link) => link.shortCode === code)) code = generateCode(6);
  } else if (store.links.some((link) => link.shortCode === code)) {
    throw new HttpError(409, `Short code "${code}" is already in use`);
  }

  const fallback = optionalUrl(input.fallbackDestination);
  return {
    id: `lnk_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`,
    shortCode: code,
    originalDestination: destination,
    fallbackDestination: fallback,
    creator: input.creator?.trim() || 'aXora',
    creatorRole: input.creatorRole || 'Admin',
    edgeStatus: input.edgeStatus || 'Active',
    campaign: input.campaign?.trim() || 'Uncategorized',
    tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 12) : ['#new-link'],
    passcodeEnabled: Boolean(input.passcodeEnabled && input.passcode),
    passcode: input.passcodeEnabled && input.passcode ? String(input.passcode).slice(0, 80) : undefined,
    clickThreshold: Number(input.clickThreshold) || 10000,
    ttl: input.ttl || '30d',
    iosTarget: optionalUrl(input.iosTarget),
    androidTarget: optionalUrl(input.androidTarget),
    desktopTarget: optionalUrl(input.desktopTarget),
    createdAt: new Date().toISOString(),
    failoverEnabled: input.failoverEnabled ?? Boolean(fallback),
    maxLatencyThreshold: Number(input.maxLatencyThreshold) || 2000,
    trafficRateCap: Number(input.trafficRateCap) || 500,
    httpFailoverCodes: input.httpFailoverCodes?.length
      ? input.httpFailoverCodes.map(String)
      : ['500', '502', '503', '504', '429'],
    activeRoutingTarget: 'Primary',
    healthStatus: 'Healthy',
    failoverEventsCount: 0,
  };
}

export function listLinks(): Promise<LinkRecord[]> {
  return mutate((store) => [...store.links].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
}

export function getLink(code: string): Promise<LinkRecord | undefined> {
  const normalized = code.trim().toLowerCase();
  return mutate((store) => store.links.find((link) => link.shortCode === normalized));
}

export function createLink(input: LinkInput): Promise<LinkRecord> {
  return mutate((store) => {
    const link = buildLink(input, store);
    store.links.unshift(link);
    return link;
  });
}

export function createLinks(inputs: LinkInput[]): Promise<{ created: LinkRecord[]; errors: { shortCode?: string; error: string }[] }> {
  return mutate((store) => {
    const created: LinkRecord[] = [];
    const errors: { shortCode?: string; error: string }[] = [];
    for (const input of inputs) {
      try {
        const link = buildLink(input, store);
        store.links.unshift(link);
        created.push(link);
      } catch (error) {
        errors.push({
          shortCode: input.shortCode,
          error: error instanceof Error ? error.message : 'Could not import link',
        });
      }
    }
    return { created, errors };
  });
}

export interface LinkPatch {
  edgeStatus?: EdgeStatus;
  activeRoutingTarget?: RoutingTarget;
  healthStatus?: HealthStatus;
  failoverReason?: string;
  recordFailover?: boolean;
  originalDestination?: string;
  fallbackDestination?: string;
  campaign?: string;
  tags?: string[];
}

export function updateLink(code: string, patch: LinkPatch): Promise<LinkRecord> {
  return mutate((store) => {
    const link = store.links.find((item) => item.shortCode === code.trim().toLowerCase());
    if (!link) throw new HttpError(404, 'Short link not found');
    if (patch.edgeStatus) link.edgeStatus = patch.edgeStatus;
    if (patch.activeRoutingTarget) link.activeRoutingTarget = patch.activeRoutingTarget;
    if (patch.healthStatus) link.healthStatus = patch.healthStatus;
    if (patch.failoverReason !== undefined) link.failoverReason = patch.failoverReason;
    if (patch.recordFailover && patch.activeRoutingTarget === 'Fallback') {
      link.failoverEventsCount = (link.failoverEventsCount || 0) + 1;
    }
    if (patch.originalDestination) link.originalDestination = normalizeDestination(patch.originalDestination);
    if (patch.fallbackDestination) link.fallbackDestination = normalizeDestination(patch.fallbackDestination);
    if (patch.campaign) link.campaign = patch.campaign;
    if (patch.tags) link.tags = patch.tags.map(String).slice(0, 12);
    return link;
  });
}

export function recordVisit(
  code: string,
  kind: EventKind,
  meta: { visitorId: string; userAgent: string; referrer: string; ip: string }
): Promise<{ link: LinkRecord; destination: string }> {
  return mutate((store) => {
    const link = store.links.find((item) => item.shortCode === code.trim().toLowerCase());
    if (!link) throw new HttpError(404, 'Short link not found');
    if (link.edgeStatus !== 'Active') {
      throw new HttpError(410, 'This short link is disabled');
    }

    const client = classifyClient(meta.userAgent, meta.referrer);
    const event: EventRecord = {
      id: `evt_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`,
      linkId: link.id,
      shortCode: link.shortCode,
      kind,
      timestamp: new Date().toISOString(),
      visitorId: meta.visitorId,
      referrer: client.referrer,
      userAgent: meta.userAgent.slice(0, 300),
      device: client.device,
      browser: client.browser,
      os: client.os,
      isBot: client.isBot,
    };
    store.events.push(event);
    return { link, destination: resolveDestination(link, meta.userAgent) };
  });
}

export function resolveDestination(link: LinkRecord, userAgent: string): string {
  if (link.activeRoutingTarget === 'Fallback' && link.fallbackDestination) {
    return link.fallbackDestination;
  }
  const ua = userAgent || '';
  if (link.iosTarget && /iphone|ipad|ipod/i.test(ua)) return link.iosTarget;
  if (link.androidTarget && /android/i.test(ua)) return link.androidTarget;
  if (link.desktopTarget && !/mobile|iphone|android/i.test(ua)) return link.desktopTarget;
  return link.originalDestination;
}

export function allEvents(): Promise<EventRecord[]> {
  return mutate((store) => store.events);
}

export interface PublicLink extends LinkRecord {
  clicks: number;
  qrScans: number;
  uniqueVisitors: number;
  ctr: number;
  currentTrafficRate: number;
  shortUrl: string;
  qrUrl: string;
}

export function withStats(link: LinkRecord, events: EventRecord[], baseUrl: string): PublicLink {
  const mine = events.filter((event) => event.linkId === link.id);
  const clicks = mine.filter((event) => event.kind === 'click').length;
  const qrScans = mine.filter((event) => event.kind === 'scan').length;
  const uniqueVisitors = new Set(mine.map((event) => event.visitorId)).size;
  const total = clicks + qrScans;
  const minuteAgo = Date.now() - 60_000;
  const currentTrafficRate = mine.filter((event) => Date.parse(event.timestamp) >= minuteAgo).length;
  return {
    ...link,
    passcode: link.passcodeEnabled ? '••••••' : undefined,
    clicks,
    qrScans,
    uniqueVisitors,
    ctr: total === 0 ? 0 : Math.round((uniqueVisitors / total) * 1000) / 10,
    currentTrafficRate,
    shortUrl: `${baseUrl}/s/${link.shortCode}`,
    qrUrl: `${baseUrl}/q/${link.shortCode}`,
  };
}

export function snapshot(baseUrl: string): Promise<{ links: PublicLink[]; events: EventRecord[] }> {
  return mutate((store) => ({
    links: [...store.links]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((link) => withStats(link, store.events, baseUrl)),
    events: store.events,
  }));
}

export type AnalyticsRange = '24h' | '7d' | '30d';

export function analytics(range: AnalyticsRange, baseUrl: string) {
  return mutate((store) => {
    const now = Date.now();
    const windowMs = range === '24h' ? 24 * 60 * 60 * 1000 : range === '30d' ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const start = now - windowMs;
    const inRange = store.events.filter((event) => Date.parse(event.timestamp) >= start);
    const clicks = inRange.filter((event) => event.kind === 'click');
    const scans = inRange.filter((event) => event.kind === 'scan');

    const bucketCount = range === '24h' ? 24 : range === '30d' ? 30 : 7;
    const bucketMs = windowMs / bucketCount;
    const series = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = start + index * bucketMs;
      const bucketEnd = bucketStart + bucketMs;
      const bucketEvents = inRange.filter((event) => {
        const time = Date.parse(event.timestamp);
        return time >= bucketStart && time < bucketEnd;
      });
      return {
        bucket: new Date(bucketStart).toISOString(),
        clicks: bucketEvents.filter((event) => event.kind === 'click').length,
        scans: bucketEvents.filter((event) => event.kind === 'scan').length,
      };
    });

    const countBy = (key: 'device' | 'browser' | 'referrer') => {
      const map = new Map<string, number>();
      for (const event of inRange) map.set(event[key] || 'unknown', (map.get(event[key] || 'unknown') || 0) + 1);
      return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    };

    const createdInRange = store.links.filter((link) => Date.parse(link.createdAt) >= start).length;

    return {
      range,
      totals: {
        links: store.links.length,
        activeLinks: store.links.filter((link) => link.edgeStatus === 'Active').length,
        createdInRange,
        clicks: clicks.length,
        scans: scans.length,
        uniqueVisitors: new Set(inRange.map((event) => event.visitorId)).size,
        bots: inRange.filter((event) => event.isBot).length,
      },
      series,
      devices: countBy('device'),
      browsers: countBy('browser'),
      referrers: countBy('referrer'),
      recentEvents: [...inRange].reverse().slice(0, 40).map((event) => ({
        id: event.id,
        linkId: event.linkId,
        shortCode: event.shortCode,
        kind: event.kind,
        timestamp: event.timestamp,
        device: event.device,
        browser: event.browser,
        os: event.os,
        referrer: event.referrer,
        isBot: event.isBot,
      })),
      topLinks: [...store.links]
        .map((link) => withStats(link, inRange, baseUrl))
        .sort((a, b) => b.clicks + b.qrScans - (a.clicks + a.qrScans))
        .slice(0, 10)
        .map((link) => ({
          shortCode: link.shortCode,
          shortUrl: link.shortUrl,
          clicks: link.clicks,
          qrScans: link.qrScans,
          uniqueVisitors: link.uniqueVisitors,
        })),
    };
  });
}
