import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Minus, Layers, Crosshair, Loader2, CloudRain, Droplets, Wind } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CurrentWeather, GeoLocation } from '@/types/weather';
import { cn } from '@/utils/cn';
import { reverseGeocode } from '@/services/locationApi';
import { config } from '@/lib/config';
import { fetchCurrentWeather } from '@/services/weatherApi';
import {
  fetchRadarFeed,
  frameLabel,
  latestFrameIndex,
  PRECIP_COLOR_SCHEME,
  RADAR_COLOR_SCHEME,
  radarTileUrl,
  type RadarFeed,
} from '@/services/radarApi';
import { RadarControls } from '@/components/maps/RadarControls';
import { useSettings } from '@/hooks/useSettings';
import { conditionMeta } from '@/utils/weatherConditions';
import { convertTemp, convertWind, prefersReducedMotion, tempUnitLabel, windUnitLabel } from '@/utils/formatters';

type Layer = 'radar' | 'temperature' | 'precipitation' | 'wind' | 'cloud';

const LAYERS: { id: Layer; label: string; icon: typeof CloudRain }[] = [
  { id: 'radar', label: 'Radar', icon: CloudRain },
  { id: 'temperature', label: 'Temperature', icon: MapPin },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain },
  { id: 'wind', label: 'Wind', icon: CloudRain },
  { id: 'cloud', label: 'Clouds', icon: CloudRain },
];

/** Layers drawn from the animated RainViewer radar (keyless). */
const ANIMATED: Layer[] = ['radar', 'precipitation'];

const OW_KEY = config.weatherApiKey;

/** Overlays that need an OpenWeather tile key; radar/precipitation animate instead. */
const OW_TILE_LAYERS: Partial<Record<Layer, string>> = {
  temperature: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
  wind: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
  cloud: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png',
};

const FRAME_DURATION_MS = 700;

/** Highest zoom the free radar tiles are published at (see rainviewer.com/api). */
const RADAR_MAX_NATIVE_ZOOM = 7;

interface Props {
  location: GeoLocation;
  onSelectLocation?: (loc: GeoLocation) => void;
  title?: string;
  subtitle?: string;
}

interface PendingPoint {
  location: GeoLocation;
}

function markerIcon(html: string, size: number, className: string) {
  return L.divIcon({
    html,
    className,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export function WeatherMap({
  location,
  onSelectLocation,
  title = 'Weather Map',
  subtitle,
}: Props) {
  const { settings } = useSettings();
  const [layer, setLayer] = useState<Layer>('radar');
  const [showLayers, setShowLayers] = useState(false);
  const [pending, setPending] = useState<PendingPoint | null>(null);
  const [pendingWeather, setPendingWeather] = useState<CurrentWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [feed, setFeed] = useState<RadarFeed | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [radarLoading, setRadarLoading] = useState(true);
  const [radarError, setRadarError] = useState(false);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);
  const owLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayersRef = useRef<Set<L.TileLayer>>(new Set());

  const radarActive = ANIMATED.includes(layer);
  const colorScheme = layer === 'precipitation' ? PRECIP_COLOR_SCHEME : RADAR_COLOR_SCHEME;

  const clearRadarLayers = useCallback(() => {
    radarLayersRef.current.forEach((l) => l.remove());
    radarLayersRef.current.clear();
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      // Matches the radar's native resolution so the overlay starts out crisp.
      zoom: RADAR_MAX_NATIVE_ZOOM,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Bright OpenStreetMap base keeps geographic details readable beneath the weather overlay.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapRef.current = map;

    // Primary location marker, labelled with the selected place name.
    const icon = markerIcon(
      `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#38bdf8;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2px solid white;animation:pulse-marker 2.6s ease-in-out infinite;">
        <span style="transform:rotate(45deg);font-size:14px;">📍</span>
      </div>`,
      28,
      'custom-map-marker'
    );
    const marker = L.marker([location.latitude, location.longitude], { icon })
      .addTo(map)
      .bindTooltip(location.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -24],
        className: 'map-label',
      });
    markerRef.current = marker;

    // Click handler — drop a labelled marker and preview that spot's weather.
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      clickMarkerRef.current?.remove();
      clickMarkerRef.current = null;

      const clickMarker = L.marker([lat, lng], {
        icon: markerIcon(
          `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,.9);box-shadow:0 0 0 6px rgba(56,189,248,.25),0 2px 12px rgba(0,0,0,.5);border:2px solid white;animation:pulse-marker 1.5s ease-in-out infinite;">
            <span style="font-size:16px;">🌤️</span>
          </div>`,
          32,
          'click-map-marker'
        ),
      }).addTo(map);
      clickMarkerRef.current = clickMarker;

      setResolving(true);
      setPending(null);
      setPendingWeather(null);

      let point: GeoLocation;
      try {
        point = await reverseGeocode(lat, lng);
      } catch {
        point = { id: `geo-${lat.toFixed(2)}-${lng.toFixed(2)}`, name: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, latitude: lat, longitude: lng };
      }
      setPending({ location: point });
      setResolving(false);

      // The picked name is pinned to the pin, so the spot is named on the map itself.
      clickMarker.bindTooltip(point.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -16],
        className: 'map-label',
      });

      setWeatherLoading(true);
      try {
        setPendingWeather(await fetchCurrentWeather(point));
      } catch {
        setPendingWeather(null);
      } finally {
        setWeatherLoading(false);
      }
    });

    const layers = radarLayersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      clickMarkerRef.current = null;
      owLayerRef.current = null;
      layers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker, its name label and the view when the selected location changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([location.latitude, location.longitude]);
    marker.unbindTooltip();
    marker.bindTooltip(location.name, {
      permanent: true,
      direction: 'top',
      offset: [0, -24],
      className: 'map-label',
    });
    map.setView(
      [location.latitude, location.longitude],
      Math.max(map.getZoom(), RADAR_MAX_NATIVE_ZOOM),
      {
        animate: true,
        duration: 0.8,
      }
    );
  }, [location]);

  // Load the keyless radar frame index (last ~2 hours + short nowcast)
  useEffect(() => {
    let cancelled = false;
    fetchRadarFeed()
      .then((data) => {
        if (cancelled) return;
        setFeed(data);
        setFrameIndex(latestFrameIndex(data.frames));
        setRadarError(data.frames.length === 0);
      })
      .catch(() => {
        if (!cancelled) setRadarError(true);
      })
      .finally(() => {
        if (!cancelled) setRadarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Loop the frames while playing
  useEffect(() => {
    if (!radarActive || !playing || !feed || feed.frames.length < 2) return;
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % feed.frames.length);
    }, FRAME_DURATION_MS);
    return () => window.clearInterval(id);
  }, [radarActive, playing, feed]);

  // Draw the radar frame, cross-fading from the previous one so the loop is smooth
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!radarActive || !feed) {
      clearRadarLayers();
      return;
    }
    const frame = feed.frames[frameIndex];
    if (!frame) return;

    const next = L.tileLayer(radarTileUrl(feed.host, frame, colorScheme), {
      opacity: 0,
      zIndex: 401,
      // RainViewer's free tile cache stops at zoom 7; deeper zooms are scaled up
      // from those tiles (requesting them directly returns a placeholder image).
      maxNativeZoom: RADAR_MAX_NATIVE_ZOOM,
      maxZoom: 19,
      className: 'radar-tiles',
      attribution: '&copy; RainViewer',
    }).addTo(map);

    radarLayersRef.current.add(next);
    window.requestAnimationFrame(() => next.setOpacity(0.78));

    const stale = Array.from(radarLayersRef.current).filter((l) => l !== next);
    if (stale.length) {
      window.setTimeout(() => {
        stale.forEach((l) => {
          l.remove();
          radarLayersRef.current.delete(l);
        });
      }, 500);
    }
  }, [radarActive, feed, frameIndex, colorScheme, clearRadarLayers]);

  // Optional keyed OpenWeather overlays for the non-radar layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    owLayerRef.current?.remove();
    owLayerRef.current = null;
    const url = OW_TILE_LAYERS[layer];
    if (!OW_KEY || radarActive || !url) return;
    owLayerRef.current = L.tileLayer(`${url}?appid=${OW_KEY}`, {
      maxZoom: 19,
      opacity: 0.58,
      zIndex: 400,
    }).addTo(map);
  }, [layer, radarActive]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(
      [location.latitude, location.longitude],
      radarActive ? RADAR_MAX_NATIVE_ZOOM : 10,
      { animate: true, duration: 0.8 }
    );
  };

  const confirmLocation = () => {
    if (pending && onSelectLocation) {
      onSelectLocation(pending.location);
      dismissPending();
    }
  };

  const dismissPending = () => {
    setPending(null);
    setPendingWeather(null);
    setWeatherLoading(false);
    clickMarkerRef.current?.remove();
    clickMarkerRef.current = null;
  };

  const activeLabel = LAYERS.find((l) => l.id === layer)?.label ?? 'Radar';
  const currentFrame = feed?.frames[frameIndex];
  const timeLabel = feed && currentFrame ? frameLabel(currentFrame, feed.frames) : '—';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          {subtitle && <span className="text-xs text-white/50">{subtitle}</span>}
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/70">
          <MapPin className="h-3.5 w-3.5 text-aether-300" />
          {location.name}
        </span>
      </div>

      <div className="glass-card relative overflow-hidden rounded-2xl">
        <div className="relative h-[55vh] min-h-[400px] w-full">
          <div ref={containerRef} className="absolute inset-0 z-0" />

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/20" />

          {/* Layer selector */}
          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
            {showLayers && (
              <div className="glass-strong flex flex-col gap-1 rounded-xl border border-white/10 p-1.5 animate-slide-down">
                {LAYERS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLayer(l.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs transition-colors',
                        layer === l.id ? 'bg-aether-500/30 text-white' : 'text-white/70 hover:bg-white/10'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {l.label}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setShowLayers((v) => !v)}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Map layers"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="absolute left-3 top-3 z-20 flex flex-col gap-1">
            <button
              onClick={zoomIn}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={zoomOut}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={recenter}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Current location"
              title="Center on current location"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>

          {/* Resolving indicator */}
          {resolving && (
            <div className="glass absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Identifying location...
            </div>
          )}

          {/* Confirm card for the clicked spot */}
          {pending && !resolving && (
            <div className="glass-strong absolute bottom-20 left-1/2 z-30 flex w-[min(92%,380px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-white/15 p-4 shadow-2xl animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-aether-500/30">
                  <MapPin className="h-5 w-5 text-aether-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {pending.location.name}
                    {pending.location.region ? `, ${pending.location.region}` : ''}
                  </p>
                  {pending.location.country && (
                    <p className="text-xs text-white/50">{pending.location.country}</p>
                  )}
                  <p className="mt-1 text-[11px] text-white/45">
                    {pending.location.latitude.toFixed(2)}°, {pending.location.longitude.toFixed(2)}°
                  </p>
                </div>
              </div>

              {/* Weather at the picked spot */}
              {weatherLoading ? (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading weather here...
                </div>
              ) : pendingWeather ? (
                <div className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-semibold leading-none text-white">
                      {Math.round(convertTemp(pendingWeather.temperature, settings.tempUnit))}
                      {tempUnitLabel(settings.tempUnit)}
                    </span>
                    <span className="mt-0.5 text-[11px] text-white/60">
                      {conditionMeta(pendingWeather.condition).label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-[11px] text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Wind className="h-3.5 w-3.5 text-aether-300" />
                      {Math.round(convertWind(pendingWeather.windSpeed, settings.windUnit))}{' '}
                      {windUnitLabel(settings.windUnit)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-aether-300" />
                      {pendingWeather.humidity}% humidity
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/50">Weather unavailable for this spot.</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={confirmLocation}
                  className="flex-1 rounded-xl bg-aether-500/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-aether-500/60"
                >
                  Yes, show forecast
                </button>
                <button
                  onClick={dismissPending}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Radar playback / active layer */}
          <div className="absolute inset-x-3 bottom-3 z-20">
            {radarActive ? (
              radarError ? (
                <div className="glass-strong flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-xs text-white/70">
                  <CloudRain className="h-4 w-4 text-aether-300" />
                  Radar imagery is unavailable right now.
                </div>
              ) : (
                <RadarControls
                  frames={feed?.frames ?? []}
                  index={frameIndex}
                  playing={playing}
                  loading={radarLoading}
                  label={timeLabel}
                  onTogglePlay={() => setPlaying((p) => !p)}
                  onScrub={(i) => {
                    setPlaying(false);
                    setFrameIndex(i);
                  }}
                />
              )
            ) : (
              <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white">
                <MapPin className="h-3.5 w-3.5 text-aether-300" />
                {activeLabel} layer
                {!OW_KEY && <span className="text-white/50">· needs an OpenWeather key</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="px-1 text-xs text-white/45">
        Click anywhere on the map to name that spot and preview its weather. Live radar animates the last 2
        hours of global precipitation by RainViewer, with OpenStreetMap beneath it.
      </p>
    </div>
  );
}
