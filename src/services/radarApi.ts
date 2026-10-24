import { safeFetchJson } from '@/lib/api';

/**
 * Animated precipitation radar tiles.
 *
 * RainViewer publishes a free, keyless index of global radar frames (the past
 * ~2 hours every 10 minutes, plus a short nowcast). It is used here so the
 * radar works on the keyless Open-Meteo setup instead of depending on an
 * OpenWeather tile key.
 */

const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';

/** How many past frames to keep — the last 2 hours at 10-minute steps. */
const PAST_FRAMES = 13;

export interface RadarFrame {
  /** Unix seconds the frame was measured at. */
  time: number;
  /** Tile path segment, e.g. `/v2/radar/815169cc2c56`. */
  path: string;
  /** True for short-range forecast frames (shown after "now"). */
  nowcast: boolean;
}

export interface RadarFeed {
  /** Tile host reported by the index (e.g. `https://tilecache.rainviewer.com`). */
  host: string;
  frames: RadarFrame[];
}

interface RainViewerIndex {
  host?: string;
  radar?: {
    past?: { time: number; path: string }[];
    nowcast?: { time: number; path: string }[];
  };
}

export async function fetchRadarFeed(): Promise<RadarFeed> {
  const data = await safeFetchJson<RainViewerIndex>(RAINVIEWER_INDEX);
  const host = data.host ?? 'https://tilecache.rainviewer.com';
  const past = (data.radar?.past ?? []).slice(-PAST_FRAMES).map((f) => ({ ...f, nowcast: false }));
  const nowcast = (data.radar?.nowcast ?? []).map((f) => ({ ...f, nowcast: true }));
  return { host, frames: [...past, ...nowcast] };
}

/** RainViewer colour schemes: 2 = universal blue, 4 = TWC-style radar. */
export const RADAR_COLOR_SCHEME = 4;
export const PRECIP_COLOR_SCHEME = 2;

export function radarTileUrl(host: string, frame: RadarFrame, colorScheme: number): string {
  // 256px tiles, smooth edges, snow shown as well as rain.
  return `${host}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`;
}

/** Index of the most recent measured (non-forecast) frame. */
export function latestFrameIndex(frames: RadarFrame[]): number {
  const i = frames.map((f) => !f.nowcast).lastIndexOf(true);
  return i < 0 ? Math.max(0, frames.length - 1) : i;
}

export function frameLabel(frame: RadarFrame, frames: RadarFrame[], now = Date.now()): string {
  const time = frame.time * 1000;
  const clock = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (frames[latestFrameIndex(frames)]?.time === frame.time) return `${clock} · now`;
  const diffMin = Math.round((time - now) / 60000);
  return diffMin < 0 ? `${clock} · ${Math.abs(diffMin)} min ago` : `${clock} · in ${diffMin} min`;
}
