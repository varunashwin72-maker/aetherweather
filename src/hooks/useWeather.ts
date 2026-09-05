import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoLocation, WeatherData, WeatherError } from '@/types/weather';
import { fetchWeather } from '@/services/weatherApi';
import { ApiError } from '@/lib/api';

interface UseWeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: WeatherError | null;
  lastUpdated: number | null;
  refresh: () => void;
}

function toWeatherError(e: unknown): WeatherError {
  if (e instanceof ApiError) {
    return { type: e.type as WeatherError['type'], message: e.message };
  }
  return { type: 'unknown', message: 'Something went wrong while loading weather data.' };
}

export function useWeather(
  location: GeoLocation | null,
  autoRefreshMinutes = 10
): UseWeatherState {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WeatherError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!location) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeather(location);
      if (!controller.signal.aborted) {
        setData(result);
        setLastUpdated(Date.now());
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(toWeatherError(e));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (!location) {
      setData(null);
      setError(null);
      return;
    }
    load();
  }, [load, location]);

  useEffect(() => {
    if (!location || !autoRefreshMinutes) return;
    const id = setInterval(() => load(), autoRefreshMinutes * 60 * 1000);
    return () => clearInterval(id);
  }, [load, location, autoRefreshMinutes]);

  return { data, loading, error, lastUpdated, refresh: load };
}
