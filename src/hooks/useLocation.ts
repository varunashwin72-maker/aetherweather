import { useCallback, useEffect, useState } from 'react';
import type { GeoLocation } from '@/types/weather';
import { ApiError } from '@/lib/api';
import { reverseGeocode, searchLocations } from '@/services/locationApi';

export function useGeolocation() {
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [locating, setLocating] = useState(false);

  const requestCurrent = useCallback(async (): Promise<GeoLocation> => {
    if (!('geolocation' in navigator)) {
      throw new ApiError('permission', 'Geolocation is not available on this device.');
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      setPermission('granted');
      const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      return loc;
    } catch (e) {
      setPermission('denied');
      if (e instanceof GeolocationPositionError || (e as GeolocationPositionError)?.code) {
        throw new ApiError(
          'permission',
          'Location access was denied. Search for a city instead, or allow location access in your browser settings.'
        );
      }
      throw e;
    } finally {
      setLocating(false);
    }
  }, []);

  return { permission, locating, requestCurrent };
}

export function useLocationSearch() {
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchLocations(query);
      setResults(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => setResults([]);
  }, []);

  return { results, loading, error, search, setResults };
}
