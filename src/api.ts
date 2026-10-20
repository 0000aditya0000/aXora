import { AnalyticsSummary, ShortRoute } from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export function listLinks() {
  return request<ShortRoute[]>('/api/links');
}

export function createLink(link: Partial<ShortRoute>) {
  return request<ShortRoute>('/api/links', {
    method: 'POST',
    body: JSON.stringify(link),
  });
}

export function updateLink(code: string, patch: Partial<ShortRoute> & { recordFailover?: boolean }) {
  return request<ShortRoute>(`/api/links/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function importLinks(links: Partial<ShortRoute>[]) {
  return request<{ created: ShortRoute[]; errors: { shortCode?: string; error: string }[] }>('/api/links/bulk', {
    method: 'POST',
    body: JSON.stringify({ links }),
  });
}

export function fetchAnalytics(range: '24h' | '7d' | '30d') {
  return request<AnalyticsSummary>(`/api/analytics?range=${range}`);
}
