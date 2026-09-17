import { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Minus, Layers, Crosshair, Loader2, CloudRain } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation } from '@/types/weather';
import { cn } from '@/utils/cn';
import { owReverseGeocode } from '@/services/openWeatherApi';

type Layer = 'radar' | 'temperature' | 'precipitation' | 'wind' | 'cloud';

const LAYERS: { id: Layer; label: string; icon: typeof CloudRain }[] = [
  { id: 'radar', label: 'Radar', icon: CloudRain },
  { id: 'temperature', label: 'Temperature', icon: MapPin },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain },
  { id: 'wind', label: 'Wind', icon: CloudRain },
  { id: 'cloud', label: 'Clouds', icon: CloudRain },
];

const OW_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;

const OW_TILE_LAYERS: Record<Layer, string> = {
  radar: 'https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png',
  temperature: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
  precipitation: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
  wind: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
  cloud: 'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png',
};

interface Props {
  location: GeoLocation;
  onSelectLocation?: (loc: GeoLocation) => void;
}

export function WeatherMap({ location, onSelectLocation }: Props) {
  const [layer, setLayer] = useState<Layer>('radar');
  const [showLayers, setShowLayers] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<GeoLocation | null>(null);
  const [resolving, setResolving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const weatherTileRef = useRef<L.TileLayer | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Dark-themed base map for a more realistic weather radar look
    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapRef.current = map;

    // Primary location marker
    const icon = L.divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#38bdf8;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2px solid white;">
        <span style="transform:rotate(45deg);font-size:14px;">📍</span>
      </div>`,
      className: 'custom-map-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(map);
    marker.bindPopup(`<b>${location.name}</b>${location.country ? `<br/>${location.country}` : ''}`);
    markerRef.current = marker;

    // Click handler — drop a temp marker and ask user to confirm
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Remove previous click marker
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }

      const clickIcon = L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(56,189,248,.9);box-shadow:0 0 0 6px rgba(56,189,248,.25),0 2px 12px rgba(0,0,0,.5);border:2px solid white;animation:pulse-marker 1.5s ease-in-out infinite;">
          <span style="font-size:16px;">🌤️</span>
        </div>`,
        className: 'click-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const clickMarker = L.marker([lat, lng], { icon: clickIcon }).addTo(map);
      clickMarkerRef.current = clickMarker;

      setResolving(true);
      try {
        const resolved = await owReverseGeocode(lat, lng);
        setPendingLocation(resolved);
      } catch {
        setPendingLocation({
          id: `geo-${lat.toFixed(2)}-${lng.toFixed(2)}`,
          name: 'Dropped Pin',
          latitude: lat,
          longitude: lng,
        });
      } finally {
        setResolving(false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      weatherTileRef.current = null;
      clickMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + view when location changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([location.latitude, location.longitude]);
    marker.bindPopup(`<b>${location.name}</b>${location.country ? `<br/>${location.country}` : ''}`);
    map.setView([location.latitude, location.longitude], map.getZoom() < 8 ? 8 : map.getZoom(), {
      animate: true,
      duration: 0.8,
    });
  }, [location]);

  // Update weather overlay when layer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (weatherTileRef.current) {
      weatherTileRef.current.remove();
      weatherTileRef.current = null;
    }

    if (OW_KEY) {
      const weatherLayer = L.tileLayer(`${OW_TILE_LAYERS[layer]}?appid=${OW_KEY}`, {
        maxZoom: 19,
        opacity: 0.65,
        zIndex: 400,
      });
      weatherLayer.addTo(map);
      weatherTileRef.current = weatherLayer;
    }
  }, [layer]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([location.latitude, location.longitude], 10, { animate: true, duration: 0.8 });
  };

  const confirmLocation = () => {
    if (pendingLocation && onSelectLocation) {
      onSelectLocation(pendingLocation);
      setPendingLocation(null);
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }
    }
  };

  const cancelLocation = () => {
    setPendingLocation(null);
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Weather Map</h2>
        <span className="text-xs text-white/50">{location.name}</span>
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

          {/* Active layer chip */}
          <div className="glass absolute bottom-3 left-3 z-20 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white">
            <MapPin className="h-3.5 w-3.5 text-aether-300" />
            {LAYERS.find((l) => l.id === layer)?.label} layer
          </div>

          {/* Resolving indicator */}
          {resolving && (
            <div className="glass absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Identifying location...
            </div>
          )}

          {/* Confirm dialog for clicked location */}
          {pendingLocation && !resolving && (
            <div className="glass-strong absolute bottom-3 left-1/2 z-30 flex w-[min(90%,360px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-white/15 p-4 shadow-2xl animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-aether-500/30">
                  <MapPin className="h-5 w-5 text-aether-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {pendingLocation.name}
                    {pendingLocation.region ? `, ${pendingLocation.region}` : ''}
                  </p>
                  {pendingLocation.country && (
                    <p className="text-xs text-white/50">{pendingLocation.country}</p>
                  )}
                  <p className="mt-1 text-xs text-white/60">
                    Show weather forecast for this location?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmLocation}
                  className="flex-1 rounded-xl bg-aether-500/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-aether-500/60"
                >
                  Yes, show forecast
                </button>
                <button
                  onClick={cancelLocation}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="px-1 text-xs text-white/45">
        Click anywhere on the map to check the weather at that spot. Live radar and weather overlays are powered
        by OpenWeather.
      </p>
    </div>
  );
}
