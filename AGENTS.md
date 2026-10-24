# AetherWeather — sandbox notes

## What this app is

Pure client-side Vite + React + TypeScript SPA. **No backend, no database, no server-side code.**
It talks to the keyless Open-Meteo APIs (weather, geocoding, air quality) directly from the browser,
so **no external credentials are needed to run it** (see "Environment variables" below).

`src/App.tsx` does its own view switching via `NavId` state — there is no router and no URL routes,
so every "page" (Home, Forecast, Radar, Maps, Air, Alerts, Favorites, Settings) is a tab, not a path.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d --build   # web entry: http://localhost:3000
docker compose -f docker-compose.base44.yml logs -f web
```

- One service (`web`) runs the Vite dev server (`npm run dev`) from the bind-mounted source, so
  edits appear via HMR without a rebuild. Vite's watcher does receive inotify events through the
  bind mount here — polling is not needed.
- `node_modules` lives in the `web_node_modules` Docker volume; the container runs `npm ci` against
  the committed lockfile at startup. If `package.json`/`package-lock.json` change, restart the
  service (`docker compose -f docker-compose.base44.yml restart web` or `up -d`) — that is not a
  code change to the app itself but does need a fresh install.
- Vite is pinned at 5.4.8 by the lockfile, which predates `server.allowedHosts`; its dev server does
  not host-check, so the preview proxy's Host header is accepted as-is. If Vite is ever upgraded past
  5.4.12, pass `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (already wired in compose) or extend
  `server.allowedHosts` with `.${BASE44_SANDBOX_HOST_DOMAIN}` gated on
  `process.env.BASE44_PREVIEW_MODE === '1'`.
- Vite's HMR client targets the page's own origin (its generated client uses
  `<location.hostname>:<location.port>` when no HMR host/port is configured), so hot reload works
  through the preview proxy without extra config.

## Environment variables

`.env.example` documents optional keys. The app's default provider is `open-meteo`, which is keyless,
so a bare checkout runs with **no `.env` at all**. Do not create one from `.env.example` as-is: it
sets `VITE_WEATHER_API_PROVIDER=openweather`, which switches to the keyed provider. Only add a
`VITE_WEATHER_API_KEY` if someone actually wants OpenWeather, and never commit a real key.

Keys are only needed for the map's temperature/wind/cloud overlays (OpenWeather tiles). The animated
radar is keyless: it uses RainViewer's public frame index (`src/services/radarApi.ts`), whose free
tile cache **stops at zoom 7** — the tile layers set `maxNativeZoom: 7` so deeper zooms are scaled
from those tiles instead of returning the server's "Zoom Level Not Supported" placeholder.

## Verifying it works

- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200, and
  `curl -s http://localhost:3000/src/main.tsx` returns untransformed JSX (proof the dev server is
  serving the clone, not a prebuilt bundle).
- In the preview: the Home tab shows live numbers for New York (temperature, "Feels like"), the
  Forecast tab shows the 7-day cards, and the Air Quality tab shows the European AQI value. All of
  them come from `api.open-meteo.com` / `air-quality-api.open-meteo.com`, so a blank panel means the
  network request failed, not a build problem.
- `npm run typecheck` / `npm run lint` / `npm run build` do not need the container: nothing is
  installed on the sandbox host — run them inside it, e.g.
  `docker compose -f docker-compose.base44.yml exec web npm run typecheck`.
