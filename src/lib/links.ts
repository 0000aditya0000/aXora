import { ShortRoute } from '../types';

type CodeLike = string | Pick<ShortRoute, 'shortCode'> & Partial<Pick<ShortRoute, 'shortUrl' | 'qrUrl'>>;

function codeOf(value: CodeLike) {
  return typeof value === 'string' ? value : value.shortCode;
}

export function shortPrefix() {
  if (typeof window === 'undefined') return '/s/';
  return `${window.location.host}/s/`;
}

export function clickUrl(value: CodeLike) {
  if (typeof value !== 'string' && value.shortUrl) return value.shortUrl;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/s/${codeOf(value)}`;
}

export function scanUrl(value: CodeLike) {
  if (typeof value !== 'string' && value.qrUrl) return value.qrUrl;
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/q/${codeOf(value)}`;
}

export function shortLabel(value: CodeLike) {
  try {
    const url = new URL(clickUrl(value));
    return `${url.host}${url.pathname}`;
  } catch {
    return codeOf(value);
  }
}
