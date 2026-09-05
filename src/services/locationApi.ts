import type { GeoLocation } from '@/types/weather';
import { ApiError, safeFetchJson } from '@/lib/api';
import { OPEN_METEO_GEO_BASE } from '@/lib/config';

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoResult[];
}

export async function searchLocations(query: string, count = 8): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = `${OPEN_METEO_GEO_BASE}/search?name=${encodeURIComponent(
    trimmed
  )}&count=${count}&language=en&format=json`;
  try {
    const data = await safeFetchJson<OpenMeteoGeoResponse>(url);
    return (data.results ?? []).map(mapGeo);
  } catch (e) {
    if (e instanceof ApiError && e.type === 'not-found') return [];
    throw e;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const url = `${OPEN_METEO_GEO_BASE}/search?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(4)}&count=1&language=en&format=json`;
  const data = await safeFetchJson<OpenMeteoGeoResponse>(url);
  const hit = data.results?.[0];
  if (hit) return mapGeo(hit);
  return {
    id: `geo-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    name: 'Current Location',
    latitude: lat,
    longitude: lon,
  };
}

export function mapGeo(r: OpenMeteoGeoResult): GeoLocation {
  return {
    id: `om-${r.id}`,
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  };
}
