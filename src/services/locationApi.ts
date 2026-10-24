import type { GeoLocation } from '@/types/weather';
import { ApiError, safeFetchJson } from '@/lib/api';
import { config, OPEN_METEO_GEO_BASE } from '@/lib/config';
import { owSearchLocations, owReverseGeocode } from '@/services/openWeatherApi';

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

/** Keyless OpenStreetMap reverse geocoding (see `reverseGeocode`). */
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimReverse {
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
  };
}

export async function searchLocations(query: string, count = 8): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (config.weatherApiProvider === 'openweather' && config.weatherApiKey) {
    return owSearchLocations(trimmed, count);
  }

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

/**
 * Turn a point picked on the map into a real place name.
 *
 * Open-Meteo's geocoding API is search-by-name only — it rejects
 * latitude/longitude lookups — so the keyless path uses OpenStreetMap's
 * Nominatim service, which is free and needs no key either. If it fails we fall
 * back to plain coordinates instead of throwing, so a map click always resolves.
 * The clicked point is kept as the location's coordinates (rather than the
 * centroid Nominatim reports) so the weather shown is for the spot picked.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  if (config.weatherApiProvider === 'openweather' && config.weatherApiKey) {
    return owReverseGeocode(lat, lon);
  }

  try {
    const data = await safeFetchJson<NominatimReverse>(nominatimReverseUrl(lat, lon));
    const place = mapNominatim(data, lat, lon);
    if (place) return place;
  } catch {
    /* fall through to the coordinate label below */
  }

  return coordinateFallback(lat, lon);
}

function coordinateFallback(lat: number, lon: number): GeoLocation {
  return {
    id: `geo-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    latitude: lat,
    longitude: lon,
  };
}

function nominatimReverseUrl(lat: number, lon: number): string {
  return `${NOMINATIM_REVERSE}?format=jsonv2&lat=${lat.toFixed(
    4
  )}&lon=${lon.toFixed(4)}&zoom=10&addressdetails=1`;
}

function mapNominatim(data: NominatimReverse, lat: number, lon: number): GeoLocation | null {
  const a = data.address ?? {};
  const name =
    a.city ??
    a.town ??
    a.village ??
    a.municipality ??
    a.county ??
    a.state ??
    data.name ??
    data.display_name?.split(',')[0]?.trim();
  if (!name) return null;
  return {
    id: `geo-${lat.toFixed(3)}-${lon.toFixed(3)}`,
    name,
    region: a.state ?? a.region,
    country: a.country,
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
