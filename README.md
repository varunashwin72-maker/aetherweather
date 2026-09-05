# AetherWeather

A cinematic, real-time weather experience with immersive animated backgrounds, forecasts, radar maps, air quality, wind visualization, sun & moon tracking, smart weather insights, and alerts.

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React icons
- Canvas-based particle weather effects (rain, snow, thunder, fog, clouds, stars)
- Open-Meteo API (keyless) for weather, geocoding, and air quality

## Features

- **Immersive weather backgrounds** — the entire interface reacts to current conditions with GPU-friendly canvas animations (rain, snow, thunderstorms with lightning, fog, clouds, day/night skies, stars, sun/moon glow).
- **Real-time weather** — current temperature, feels-like, humidity, wind, visibility, pressure, UV index, cloud cover, precipitation. Auto-refreshes on a configurable interval.
- **Hourly forecast** — 24-hour horizontal scroller with an interactive temperature graph and selectable hour details.
- **7-day forecast** — expandable daily cards with high/low range bars and detailed metrics.
- **Weather insights** — generated from actual forecast data (rain timing, temperature drops, UV windows, wind warnings) without claiming to use AI.
- **Weather alerts** — severity-ranked alerts for high UV, wind, heat, cold, low visibility, and heavy rain.
- **Air quality** — European AQI meter with PM2.5, PM10, CO, NO₂, O₃, SO₂ breakdown.
- **Sun & Moon** — animated sun arc, sunrise/sunset/solar noon, day length, and moon phase visualization.
- **Wind compass** — animated circular compass with direction, speed, and gusts.
- **Precipitation timeline** — 12-hour probability bars and "rain expected in X minutes" prediction.
- **Weather map** — interactive map with layer selector (radar, temperature, precipitation, wind, clouds) and zoom controls, with an abstraction for plugging in a dedicated radar provider.
- **Favorites** — save, remove, and drag-to-reorder locations (stored in localStorage).
- **Search** — worldwide city search with suggestions, recents, favorites, keyboard navigation, and current-location geolocation.
- **Settings** — Celsius/Fahrenheit, wind units, theme, animation intensity (with automatic reduced-motion support), background effects toggle, auto-refresh interval, and notifications.
- **Responsive** — desktop dashboard, adaptive tablet grid, and mobile with bottom navigation.
- **Accessibility** — keyboard navigation, ARIA labels, focus indicators, and `prefers-reduced-motion` support.
- **Error handling** — friendly states for API failure, no connection, not found, permission denied, rate limiting, and missing configuration.

## Project structure

```
src/
  components/
    navigation/   Navbar, MobileNav, SearchBar, FavoritesPanel
    weather/      WeatherBackground, WeatherIcon, HeroWeather, InsightsPanel,
                  PrecipitationTimeline, WindCompass
    forecast/     HourlyForecast, DailyForecast
    maps/         WeatherMap
    charts/       (temperature graph lives in HourlyForecast)
    alerts/       AlertsPanel
    air-quality/  AirQualityPanel
    astronomy/    SunMoonPanel
    ui/           GlassCard, Skeleton, ErrorState, SettingsPanel
  pages/          Home, Forecast, Radar, Maps, Air, Alerts
  services/       weatherApi, locationApi, airQualityApi
  hooks/          useWeather, useLocation, useSettings, useFavorites
  types/          weather.ts
  utils/          weatherConditions, formatters, insights, cn
  animations/     weatherEffects
  lib/            api, config
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. The default weather provider is **Open-Meteo**, which is keyless — no API key is required to run the app.

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_WEATHER_API_PROVIDER` | No | `open-meteo` (default, keyless) or `openweather` |
| `VITE_WEATHER_API_KEY` | No* | Weather API key (only needed for keyed providers) |
| `VITE_MAP_API_KEY` | No | Map/tile API key (base map uses OpenStreetMap by default) |
| `VITE_AIR_QUALITY_API_KEY` | No | Air quality API key (Open-Meteo Air Quality is keyless) |

\* With the default Open-Meteo provider, the app works without any API keys. The app also shows a clear configuration state if a keyed provider is selected without a key.

## API configuration

The app uses a **normalized weather data model** (`WeatherData`) so the UI is independent of the provider. The `weatherApi` service transforms provider-specific responses into this model, making it easy to swap providers.

- **Open-Meteo** (default): free, keyless, covers current weather, hourly/daily forecasts, geocoding, and air quality.
- **OpenWeather** (optional): requires `VITE_WEATHER_API_KEY`. Add the provider-specific transformation in `src/services/weatherApi.ts`.

A radar provider abstraction exists in `src/components/maps/WeatherMap.tsx` so a dedicated radar/layer service can be connected later without UI changes.

## Development

```bash
npm run dev      # start dev server
npm run typecheck  # type-check only
npm run lint     # lint
```

## Production build

```bash
npm run build
npm run preview  # preview the production build locally
```

## Deploy to Vercel

1. Push your project to a Git repository (GitHub, GitLab, or Bitbucket).
2. Import the repository into [Vercel](https://vercel.com).
3. Vercel auto-detects Vite. No custom build settings are needed:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add any environment variables under **Project Settings → Environment Variables** (e.g. `VITE_WEATHER_API_KEY` if using a keyed provider).
5. Deploy.

## Notes

- No API keys are ever hardcoded. All secrets are read from environment variables.
- The app works without any API key using the default Open-Meteo provider.
- Preferences and favorites are stored in `localStorage` — no account required.
