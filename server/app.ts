import express, { type Request, type Response, type NextFunction } from 'express';
import QRCode from 'qrcode';
import { applyVisit } from './redirect.ts';
import {
  HttpError,
  analytics,
  createLink,
  createLinks,
  getLink,
  snapshot,
  storageMode,
  updateLink,
  type AnalyticsRange,
  type LinkInput,
} from './store.ts';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') return next();
  if (typeof req.body === 'string' && req.body) {
    const type = req.headers['content-type'] || '';
    if (type.includes('application/json')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        req.body = {};
      }
      return next();
    }
    if (type.includes('application/x-www-form-urlencoded')) {
      req.body = Object.fromEntries(new URLSearchParams(req.body));
      return next();
    }
  }
  express.json({ limit: '1mb' })(req, res, (error) => {
    if (error) return next(error);
    express.urlencoded({ extended: false })(req, res, next);
  });
});

function baseUrl(req: Request) {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'axora-shortener', storage: storageMode() });
});

app.get('/api/links', async (req, res, next) => {
  try {
    const data = await snapshot(baseUrl(req));
    res.json(data.links);
  } catch (error) {
    next(error);
  }
});

app.post('/api/links', async (req, res, next) => {
  try {
    const created = await createLink(req.body as LinkInput);
    const data = await snapshot(baseUrl(req));
    const link = data.links.find((item) => item.id === created.id);
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
});

app.post('/api/links/bulk', async (req, res, next) => {
  try {
    const items = Array.isArray(req.body?.links) ? (req.body.links as LinkInput[]) : [];
    if (items.length === 0) throw new HttpError(400, 'Provide a links array');
    if (items.length > 200) throw new HttpError(400, 'Import up to 200 links at a time');
    const result = await createLinks(items);
    const data = await snapshot(baseUrl(req));
    res.status(201).json({
      created: data.links.filter((link) => result.created.some((item) => item.id === link.id)),
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/links/:code/qr.png', async (req, res, next) => {
  try {
    const link = await getLink(req.params.code);
    if (!link) throw new HttpError(404, 'Short link not found');
    const png = await QRCode.toBuffer(`${baseUrl(req)}/q/${link.shortCode}`, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#f97316', light: '#0a0e17' },
    });
    res.setHeader('Cache-Control', 'no-store');
    res.type('png').send(png);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/links/:code', async (req, res, next) => {
  try {
    await updateLink(req.params.code, req.body || {});
    const data = await snapshot(baseUrl(req));
    const link = data.links.find((item) => item.shortCode === req.params.code.toLowerCase());
    if (!link) throw new HttpError(404, 'Short link not found');
    res.json(link);
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics', async (req, res, next) => {
  try {
    const range = (req.query.range === '24h' || req.query.range === '30d' ? req.query.range : '7d') as AnalyticsRange;
    res.json(await analytics(range, baseUrl(req)));
  } catch (error) {
    next(error);
  }
});

app.get('/s/:code', (req, res) => {
  applyVisit(req, res, req.params.code, 'click');
});
app.post('/s/:code', (req, res) => {
  applyVisit(req, res, req.params.code, 'click');
});
app.get('/q/:code', (req, res) => {
  applyVisit(req, res, req.params.code, 'scan');
});
app.post('/q/:code', (req, res) => {
  applyVisit(req, res, req.params.code, 'scan');
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
});

export default app;
