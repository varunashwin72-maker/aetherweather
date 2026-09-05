import { useState } from 'react';
import { MapPin, Plus, Minus, Layers, Crosshair } from 'lucide-react';
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

interface Props {
  location: GeoLocation;
}

export function WeatherMap({ location }: Props) {
  const [layer, setLayer] = useState<Layer>('radar');
  const [zoom, setZoom] = useState(7);
  const [showLayers, setShowLayers] = useState(false);

  // OpenStreetMap-based static-ish preview using an iframe tile from OSM.
  // A radar provider can be plugged in here later via the abstraction below.
  const bbox = computeBbox(location.latitude, location.longitude, zoom);
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Weather Map</h2>
        <span className="text-xs text-white/50">{location.name}</span>
      </div>

      <div className="glass-card relative overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
          <iframe
            title="Weather map"
            src={mapUrl}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0, filter: 'saturate(1.1) contrast(1.05)' }}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

          {/* Layer selector */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
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
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(12, z + 1))}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(2, z - 1))}
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              className="glass grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
              aria-label="Current location"
              title="Center on current location"
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>

          {/* Active layer chip */}
          <div className="glass absolute bottom-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-white">
            <MapPin className="h-3.5 w-3.5 text-aether-300" />
            {LAYERS.find((l) => l.id === layer)?.label} layer
            <span className="text-white/40">· zoom {zoom}</span>
          </div>
        </div>
      </div>

      <p className="px-1 text-xs text-white/45">
        Base map via OpenStreetMap. Weather radar and overlay layers are wired through an abstraction so a
        dedicated radar provider can be connected without UI changes.
      </p>
    </div>
  );
}

function computeBbox(lat: number, lon: number, zoom: number): string {
  const span = 360 / Math.pow(2, zoom - 1);
  const half = span / 2;
  const minLon = lon - half;
  const maxLon = lon + half;
  const minLat = lat - half * 0.6;
  const maxLat = lat + half * 0.6;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}
