import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GeoLocation } from '@/types/weather';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { useWeather } from '@/hooks/useWeather';
import { useGeolocation } from '@/hooks/useLocation';
import { useFavorites } from '@/hooks/useFavorites';
import { Navbar, type NavId } from '@/components/navigation/Navbar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { SearchBar } from '@/components/navigation/SearchBar';
import { WeatherBackground } from '@/components/weather/WeatherBackground';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SettingsPanel } from '@/components/ui/SettingsPanel';
import { FavoritesPanel } from '@/components/navigation/FavoritesPanel';
import { Home } from '@/pages/Home';
import { Forecast } from '@/pages/Forecast';
import { Radar } from '@/pages/Radar';
import { Maps } from '@/pages/Maps';
import { Air } from '@/pages/Air';
import { Alerts } from '@/pages/Alerts';

const DEFAULT_LOCATION: GeoLocation = {
  id: 'om-5128581',
  name: 'New York',
  region: 'New York',
  country: 'United States',
  latitude: 40.7128,
  longitude: -74.006,
};

function AppInner() {
  const { settings, setSettings, motion } = useSettings();
  const [active, setActive] = useState<NavId>('home');
  const [location, setLocation] = useState<GeoLocation>(() => {
    try {
      const stored = localStorage.getItem('aether.lastLocation');
      if (stored) return JSON.parse(stored) as GeoLocation;
    } catch { /* ignore */ }
    return DEFAULT_LOCATION;
  });

  const { data, loading, error, lastUpdated, refresh } = useWeather(
    location,
    settings.autoRefreshMinutes
  );
  const { permission, locating, requestCurrent } = useGeolocation();
  const { favorites, recents, addFavorite, removeFavorite, reorderFavorites, addRecent } = useFavorites();

  useEffect(() => {
    try {
      localStorage.setItem('aether.lastLocation', JSON.stringify(location));
    } catch { /* ignore */ }
  }, [location]);

  const handleSelect = useCallback(
    (loc: GeoLocation) => {
      setLocation(loc);
      addRecent(loc);
    },
    [addRecent]
  );

  const handleUseCurrent = useCallback(async () => {
    try {
      const loc = await requestCurrent();
      handleSelect(loc);
    } catch {
      /* error surfaced via permission state */
    }
  }, [requestCurrent, handleSelect]);

  const isFavorite = useMemo(
    () => favorites.some((f) => f.id === location.id),
    [favorites, location]
  );

  const toggleFavorite = useCallback(() => {
    if (isFavorite) removeFavorite(location.id);
    else addFavorite(location);
  }, [isFavorite, location, addFavorite, removeFavorite]);

  const condition = data?.current.condition ?? 'partly-cloudy';
  const isDay = data?.current.isDay ?? true;

  return (
    <div className="relative min-h-screen">
      <WeatherBackground
        condition={condition}
        isDay={isDay}
        motion={motion}
        enabled={settings.backgroundEffects}
      />

      <div className="relative z-10">
        <Navbar
          active={active}
          onChange={setActive}
          rightSlot={
            <div className="hidden w-64 sm:block md:w-72 lg:w-80">
              <SearchBar
                onSelect={handleSelect}
                onUseCurrent={handleUseCurrent}
                locating={locating}
                recents={recents}
                favorites={favorites}
                isFavorite={isFavorite}
                onToggleFavorite={() => toggleFavorite()}
              />
            </div>
          }
        />

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:pb-12">
          {/* Mobile search */}
          <div className="mb-6 sm:hidden">
            <SearchBar
              onSelect={handleSelect}
              onUseCurrent={handleUseCurrent}
              locating={locating}
              recents={recents}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={() => toggleFavorite()}
            />
          </div>

          {permission === 'denied' && (
            <div className="mb-4">
              <ErrorState
                error={{ type: 'permission', message: 'Location access was denied. Search for a city above instead.' }}
              />
            </div>
          )}

          {!data && loading && <LoadingState />}

          {!data && !loading && error && (
            <ErrorState error={error} action={<RetryButton onClick={refresh} />} />
          )}

          {data && (
            <div className="animate-fade-in">
              {active === 'home' && (
                <Home data={data} settings={settings} loading={loading} lastUpdated={lastUpdated} onRefresh={refresh} />
              )}
              {active === 'forecast' && <Forecast data={data} settings={settings} />}
              {active === 'radar' && <Radar data={data} />}
              {active === 'maps' && <Maps data={data} />}
              {active === 'air' && <Air data={data} />}
              {active === 'alerts' && <Alerts data={data} />}
              {active === 'favorites' && (
                <FavoritesPanel
                  favorites={favorites}
                  activeId={location.id}
                  onSelect={handleSelect}
                  onRemove={removeFavorite}
                  onReorder={reorderFavorites}
                />
              )}
              {active === 'settings' && <SettingsPanel settings={settings} onChange={setSettings} />}
            </div>
          )}
        </main>

        <MobileNav active={active} onChange={setActive} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 pt-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40" />
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-2 rounded-full bg-aether-500/30 px-5 py-2 text-sm font-medium text-white transition hover:bg-aether-500/50"
    >
      Try again
    </button>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}
