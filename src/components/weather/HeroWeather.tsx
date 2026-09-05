import { RefreshCw, MapPin, Droplets, Wind, Eye, Gauge, Sun, Thermometer, ArrowUp, ArrowDown } from 'lucide-react';
import type { WeatherData } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertTemp, convertWind, tempUnitLabel, windUnitLabel } from '@/utils/formatters';
import { conditionMeta } from '@/utils/weatherConditions';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { cn } from '@/utils/cn';

interface Props {
  data: WeatherData;
  settings: Settings;
  loading: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function HeroWeather({ data, settings, loading, lastUpdated, onRefresh }: Props) {
  const { current, location } = data;
  const temp = Math.round(convertTemp(current.temperature, settings.tempUnit));
  const feels = Math.round(convertTemp(current.apparentTemperature, settings.tempUnit));
  const meta = conditionMeta(current.condition);
  const today = data.daily[0];
  const high = today ? Math.round(convertTemp(today.tempMax, settings.tempUnit)) : null;
  const low = today ? Math.round(convertTemp(today.tempMin, settings.tempUnit)) : null;
  const wind = Math.round(convertWind(current.windSpeed, settings.windUnit));
  const updatedAgo = lastUpdated ? minutesAgo(lastUpdated) : null;

  return (
    <section className="relative flex flex-col items-center px-4 pt-24 text-center sm:pt-28">
      <div className="flex items-center gap-1.5 text-sm text-white/70">
        <MapPin className="h-4 w-4 text-aether-300" />
        <span className="font-medium text-white">{location.name}</span>
        {location.region && <span className="text-white/50">, {location.region}</span>}
        {location.country && <span className="text-white/50">, {location.country}</span>}
      </div>

      <div className="mt-6 flex items-center gap-4 sm:gap-8">
        <WeatherIcon condition={current.condition} isDay={current.isDay} className="h-20 w-20 sm:h-28 sm:w-28" />
        <div className="flex items-start">
          <span className="font-display text-7xl font-semibold leading-none tracking-tighter text-white sm:text-8xl md:text-9xl">
            {temp}
          </span>
          <span className="mt-2 text-3xl font-light text-white/70 sm:text-4xl">
            {tempUnitLabel(settings.tempUnit).replace('°', '°')}
          </span>
        </div>
      </div>

      <p className="mt-3 font-display text-xl font-medium text-white sm:text-2xl">{meta.label}</p>
      <p className="mt-1 text-sm text-white/70">Feels like {feels}{tempUnitLabel(settings.tempUnit)}</p>

      {high !== null && low !== null && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-white/80">
            <ArrowUp className="h-3.5 w-3.5 text-rose-300" /> H: {high}{tempUnitLabel(settings.tempUnit)}
          </span>
          <span className="flex items-center gap-1 text-white/80">
            <ArrowDown className="h-3.5 w-3.5 text-sky-300" /> L: {low}{tempUnitLabel(settings.tempUnit)}
          </span>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-xs text-white/50">
        {updatedAgo !== null && <span>Updated {updatedAgo}</span>}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-aether-200 transition hover:bg-white/10 disabled:opacity-50"
          aria-label="Refresh weather"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric icon={<Droplets className="h-4 w-4" />} label="Humidity" value={`${current.humidity}%`} />
        <Metric icon={<Wind className="h-4 w-4" />} label="Wind" value={`${wind} ${windUnitLabel(settings.windUnit)}`} />
        <Metric icon={<Eye className="h-4 w-4" />} label="Visibility" value={formatVisibility(current.visibility, settings)} />
        <Metric icon={<Gauge className="h-4 w-4" />} label="Pressure" value={`${Math.round(current.pressure)} hPa`} />
        <Metric icon={<Sun className="h-4 w-4" />} label="UV Index" value={`${Math.round(current.uvIndex)}`} />
        <Metric icon={<Thermometer className="h-4 w-4" />} label="Cloud" value={`${current.cloudCover}%`} />
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card flex flex-col items-center gap-1 px-3 py-3 text-center">
      <span className="text-aether-200">{icon}</span>
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function minutesAgo(ts: number): string {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m === 0) return 'just now';
  if (m === 1) return '1 minute ago';
  return `${m} minutes ago`;
}

function formatVisibility(meters: number, settings: Settings): string {
  if (settings.tempUnit === 'fahrenheit') {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}
