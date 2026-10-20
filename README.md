# aXora

aXora is a link shortener with QR codes and visit analytics. Short links and QR codes share one destination, and the server counts clicks and scans separately.

The dashboard is a React app. The API is an Express server in the same process. Links and visits are stored in `data/store.json`.

## Features

- Create a short link with an optional custom code, campaign, tags, and backup URL
- Redirect visitors and record a click at `/s/:code`
- Generate a QR code that points at `/q/:code` and record a scan
- See clicks, scans, unique visitors, devices, browsers, referrers, and recent visits
- Turn a link on or off, and switch it between the primary and backup destination

Only `http` and `https` destinations are accepted.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` starts the API and the UI together. The first saved link creates `data/store.json`. That file is local and is not committed.

## How tracking works

| Action | URL | What is recorded |
| --- | --- | --- |
| Open a short link | `http://localhost:3000/s/demo1` | Click |
| Scan a QR code | `http://localhost:3000/q/demo1` | QR scan |

Both URLs redirect to the link’s current destination. A disabled link does not redirect. If a passcode is set, the visitor must enter it before the visit is counted.

Copy the short link from the dashboard when you want a click. Use the QR code when you want a scan. Do not encode the long destination URL in the QR code, or the scan will not be tracked.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/links` | List links and their totals |
| `POST` | `/api/links` | Create a link |
| `POST` | `/api/links/bulk` | Import up to 200 links |
| `PATCH` | `/api/links/:code` | Update status or failover target |
| `GET` | `/api/links/:code/qr.png` | Download the scan-tracking QR image |
| `GET` | `/api/analytics?range=24h` | Totals, time series, and recent visits |

`range` can be `24h`, `7d`, or `30d`.

Create a link:

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d "{\"originalDestination\":\"https://example.com\",\"shortCode\":\"demo1\",\"campaign\":\"Launch\"}"
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and UI on port 3000 |
| `npm run build` | Production build of the UI into `dist/` |
| `npm run preview` | Preview the static build |
| `npm run lint` | Typecheck the UI |

To serve the built UI from the API:

```bash
npm run build
```

On Windows PowerShell:

```powershell
$env:NODE_ENV = "production"
npm run dev
```

On macOS or Linux:

```bash
NODE_ENV=production npm run dev
```

The port can be changed with `PORT`.

## Project layout

```text
src/            React dashboard
server/         Express API, redirects, and storage
api/            Vercel routes for /api, /s, and /q
data/store.json Local links and visit events
dist/           Production UI build
```

## Deploy on Vercel

The dashboard build is static. Short links such as `/s/u86h` are not files in that build, so Vercel returns 404 until the API routes in this repo are deployed.

Vercel functions do not keep `data/store.json`. Connect Redis before creating links:

1. Open the Vercel project.
2. Go to **Storage** and create a **Redis** database (Upstash).
3. Connect that database to this project. Vercel adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
4. Push this repo and redeploy.
5. Create the short link again. A link created before Redis was connected was never saved, so the old `/s/...` URL will not redirect.

After deploy, `https://your-app.vercel.app/api/health` should report `"storage": "redis"`. Opening `https://your-app.vercel.app/s/your-code` then redirects and counts a click.
