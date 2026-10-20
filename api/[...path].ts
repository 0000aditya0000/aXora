import type { Request, Response } from 'express';
import app from '../server/app.ts';

export default function handler(req: Request, res: Response) {
  const raw = req.url || '/';
  const queryIndex = raw.indexOf('?');
  const pathname = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
  const search = queryIndex === -1 ? '' : raw.slice(queryIndex);
  if (!pathname.startsWith('/api')) {
    const segments = req.query?.path;
    const joined = Array.isArray(segments) ? segments.join('/') : typeof segments === 'string' ? segments : '';
    if (joined) req.url = `/api/${joined}${search}`;
  }
  return app(req, res);
}
