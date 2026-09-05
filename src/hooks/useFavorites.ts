import { useCallback, useEffect, useState } from 'react';
import type { GeoLocation } from '@/types/weather';
import { FAVORITES_KEY, RECENTS_KEY } from '@/utils/formatters';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<GeoLocation[]>(() => read<GeoLocation[]>(FAVORITES_KEY, []));
  const [recents, setRecents] = useState<GeoLocation[]>(() => read<GeoLocation[]>(RECENTS_KEY, []));

  useEffect(() => write(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => write(RECENTS_KEY, recents), [recents]);

  const addFavorite = useCallback((loc: GeoLocation) => {
    setFavorites((prev) => (prev.some((f) => f.id === loc.id) ? prev : [...prev, loc]));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorderFavorites = useCallback((from: number, to: number) => {
    setFavorites((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const addRecent = useCallback((loc: GeoLocation) => {
    setRecents((prev) => [loc, ...prev.filter((r) => r.id !== loc.id)].slice(0, 6));
  }, []);

  return { favorites, recents, addFavorite, removeFavorite, reorderFavorites, addRecent };
}
