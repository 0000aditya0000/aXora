import {
  HttpError,
  getLink,
  passwordsMatch,
  recordVisit,
  visitorKey,
  type EventKind,
} from './store.ts';

type HeaderValue = string | string[] | undefined;

type IncomingRequest = {
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, HeaderValue>;
  get?: (name: string) => string | undefined;
  socket?: { remoteAddress?: string | null };
};

type OutgoingResponse = {
  setHeader(name: string, value: string): void;
  statusCode: number;
  end(body?: string): void;
};

function header(req: IncomingRequest, name: string) {
  if (typeof req.get === 'function') return req.get(name) || '';
  const raw = req.headers?.[name.toLowerCase()] ?? req.headers?.[name];
  if (Array.isArray(raw)) return raw[0] || '';
  return raw || '';
}

function queryValue(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return typeof value === 'string' ? value : '';
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
    main { width: min(480px, calc(100% - 32px)); background: #0d1220; border: 1px solid rgba(255,255,255,.1); border-radius: 20px; padding: 28px; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0; color: #94a3b8; line-height: 1.5; }
    form { display: flex; gap: 8px; margin-top: 18px; }
    input { flex: 1; background: #090d16; color: white; border: 1px solid rgba(255,255,255,.15); border-radius: 12px; padding: 12px; }
    button { background: #f97316; color: white; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 700; cursor: pointer; }
    .err { color: #fda4af; margin-top: 12px; font-size: 14px; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

function htmlResult(status: number, title: string, body: string) {
  return { status, html: page(title, body), location: '', setCookie: '' };
}

export async function applyVisit(req: IncomingRequest, res: OutgoingResponse, code: string, kind: EventKind) {
  try {
    const link = await getLink(code);
    if (!link) {
      write(res, htmlResult(404, 'Link not found', '<h1>Link not found</h1><p>This short link does not exist. Create it again from the dashboard after storage is connected.</p>'));
      return;
    }
    if (link.edgeStatus !== 'Active') {
      write(
        res,
        htmlResult(410, 'Link disabled', `<h1>Link disabled</h1><p><strong>${escapeHtml(link.shortCode)}</strong> is not accepting visits.</p>`)
      );
      return;
    }

    const body = req.body && typeof req.body === 'object' ? (req.body as { passcode?: unknown }) : {};
    const given = typeof body.passcode === 'string' ? body.passcode : queryValue(req.query?.p);
    if (link.passcodeEnabled && link.passcode && (!given || !passwordsMatch(link.passcode, given))) {
      const error = given ? '<p class="err">Incorrect passcode.</p>' : '';
      write(
        res,
        htmlResult(
          401,
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

    const cookieHeader = header(req, 'cookie');
    const cookieMatch = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith('ax_vid='));
    const cookieId = cookieMatch ? decodeURIComponent(cookieMatch.slice('ax_vid='.length)) : undefined;
    const forwarded = header(req, 'x-forwarded-for');
    const ip = forwarded.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const userAgent = header(req, 'user-agent');
    const visitorId = visitorKey(ip, userAgent, cookieId);
    const result = await recordVisit(code, kind, {
      visitorId,
      userAgent,
      referrer: header(req, 'referer'),
      ip,
    });
    write(res, {
      status: 302,
      location: result.destination,
      html: '',
      setCookie: cookieId ? '' : `ax_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    if (status >= 500) console.error(error);
    write(res, htmlResult(status, 'Short link unavailable', `<h1>Short link unavailable</h1><p>${escapeHtml(message)}</p>`));
  }
}

function write(res: OutgoingResponse, result: { status: number; location: string; html: string; setCookie: string }) {
  if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie);
  if (result.location) {
    res.statusCode = 302;
    res.setHeader('Location', result.location);
    res.end();
    return;
  }
  res.statusCode = result.status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(result.html);
}
