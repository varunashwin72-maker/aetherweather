import { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Minus, Layers, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation } from '@/types/weather';
import { cn } from '@/utils/cn';

type Layer = 'radar' | 'temperature' | 'precipitation' | 'wind' | 'cloud';

const LAYERS: { id: Layer; label: string }[] = [
  { id: 'radar', label: 'Radar' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'precipitation', label: 'Precipitation' },
  { id: 'wind', label: 'Wind' },
  { id: 'cloud', label: 'Clouds' },
];

// OpenWeather tile layers (requires API key — same key as weather data)
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
}

export function WeatherMap({ location }: Props) {
  const [layer, setLayer] = useState<Layer>('radar');
  const [showLayers, setShowLayers] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const weatherTileRef = useRef<L.TileLayer | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
    });

    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: 'OpenStreetMap' }).addTo(map);

    mapRef.current = map;
    tileLayerRef.current = baseLayer;

    // Marker icon (default Leaflet icon needs fixing for bundlers)
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

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
      weatherTileRef.current = null;
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
    map.setView([location.latitude, location.longitude], map.getZoom(), { animate: true, duration: 0.8 });
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
        opacity: 0.6,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Weather Map</h2>
        <span className="text-xs text-white/50">{location.name}</span>
      </div>

      <div className="glass-card relative overflow-hidden rounded-2xl">
        <div className="relative h-[55vh] min-h-[400px] w-full">
          <div ref={containerRef} className="absolute inset-0 z-0" />

          {/* Gradient overlay for visual polish (pointer-events-none) */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/20" />

          {/* Layer selector */}
          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
            {showLayers && (
              <div className="glass-strong flex flex-col gap-1 rounded-xl border border-white/10 p-1.5 animate-slide-down">
                {LAYERS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayer(l.id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-left text-xs transition-colors',
                      layer === l.id ? 'bg-aether-500/30 text-white' : 'text-white/70 hover:bg-white/10'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
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
        </div>
      </div>

      <p className="px-1 text-xs text-white/45">
        Interactive map with live weather overlays from OpenWeather. Search for any city above and the map will
        fly to it automatically.
      </p>
    </div>
  );
}
