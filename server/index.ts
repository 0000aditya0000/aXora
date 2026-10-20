import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import {
  HttpError,
  analytics,
  createLink,
  createLinks,
  getLink,
  passwordsMatch,
  recordVisit,
  snapshot,
  updateLink,
  visitorKey,
  type AnalyticsRange,
  type EventKind,
  type LinkInput,
} from './store.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

function baseUrl(req: Request) {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
}

function clientIp(req: Request) {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function readCookie(req: Request, name: string) {
  const header = req.get('cookie') || '';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function page(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07090f; color: #e2e8f0; font-family: Inter, Segoe UI, sans-serif; }
    main { width: min(440px, calc(100% - 32px)); background: #0d1220; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 28px; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0; color: #94a3b8; line-height: 1.5; }
    form { display: flex; gap: 8px; margin-top: 18px; }
    input { flex: 1; background: #090d16; color: white; border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 12px; }
    button { background: #f97316; color: white; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
    .err { color: #fda4af; margin-top: 12px; font-size: 14px; }
    a { color: #fdba74; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

async function sendRedirect(req: Request, res: Response, code: string, kind: EventKind) {
  const link = await getLink(code);
  if (!link) {
    res.status(404).type('html').send(page('Link not found', '<h1>Link not found</h1><p>This short link does not exist.</p>'));
    return;
  }
  if (link.edgeStatus !== 'Active') {
    res
      .status(410)
      .type('html')
      .send(page('Link disabled', `<h1>Link disabled</h1><p><strong>${escapeHtml(link.shortCode)}</strong> is not accepting visits.</p>`));
    return;
  }

  const given = typeof req.body?.passcode === 'string' ? req.body.passcode : String(req.query.p || '');
  if (link.passcodeEnabled && link.passcode) {
    if (!given || !passwordsMatch(link.passcode, given)) {
      const error = given ? '<p class="err">Incorrect passcode.</p>' : '';
      res.status(401).type('html').send(
        page(
          'Passcode required',
          `<h1>Passcode required</h1><p>Enter the passcode to continue to this link.</p>
           <form method="post" action="${kind === 'scan' ? '/q/' : '/s/'}${escapeHtml(link.shortCode)}">
             <input name="passcode" type="password" autocomplete="current-password" placeholder="Passcode" required />
             <button type="submit">Continue</button>
           </form>${error}`
        )
      );
      return;
    }
  }

  const cookieId = readCookie(req, 'ax_vid');
  const visitorId = visitorKey(clientIp(req), req.get('user-agent') || '', cookieId);
  if (!cookieId) {
    res.setHeader('Set-Cookie', `ax_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`);
  }

  const result = await recordVisit(code, kind, {
    visitorId,
    userAgent: req.get('user-agent') || '',
    referrer: req.get('referer') || '',
    ip: clientIp(req),
  });
  res.redirect(302, result.destination);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'axora-shortener' });
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

app.get('/s/:code', (req, res, next) => {
  sendRedirect(req, res, req.params.code, 'click').catch(next);
});
app.post('/s/:code', (req, res, next) => {
  sendRedirect(req, res, req.params.code, 'click').catch(next);
});
app.get('/q/:code', (req, res, next) => {
  sendRedirect(req, res, req.params.code, 'scan').catch(next);
});
app.post('/q/:code', (req, res, next) => {
  sendRedirect(req, res, req.params.code, 'scan').catch(next);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (status >= 500) console.error(error);
  res.status(status).json({ error: message });
});

async function start() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root,
      appType: 'custom',
      server: { middlewareMode: true, hmr: { port: 24678 } },
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api') || req.path.startsWith('/s/') || req.path.startsWith('/q/') || req.path.includes('.')) {
        return next();
      }
      try {
        const templatePath = path.join(root, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    const dist = path.join(root, 'dist');
    app.use(express.static(dist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`aXora shortener running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
