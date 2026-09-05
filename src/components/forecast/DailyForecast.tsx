import { useState } from 'react';
import { ChevronDown, Droplets, Wind, Sun, Thermometer } from 'lucide-react';
import type { DayForecast } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertTemp, convertWind, tempUnitLabel, windUnitLabel } from '@/utils/formatters';
import { conditionMeta } from '@/utils/weatherConditions';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { cn } from '@/utils/cn';

interface Props {
  days: DayForecast[];
  settings: Settings;
}

export function DailyForecast({ days, settings }: Props) {
  const [open, setOpen] = useState<number | null>(0);
  const overallMin = Math.min(...days.map((d) => d.tempMin));
  const overallMax = Math.max(...days.map((d) => d.tempMax));
  const range = overallMax - overallMin || 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">7-Day Forecast</h2>
        <span className="text-xs text-white/50">Tap a day for details</span>
      </div>
      <div className="flex flex-col gap-2">
        {days.map((day, i) => {
          const isOpen = open === i;
          const meta = conditionMeta(day.condition);
          const min = Math.round(convertTemp(day.tempMin, settings.tempUnit));
          const max = Math.round(convertTemp(day.tempMax, settings.tempUnit));
          const startPct = ((day.tempMin - overallMin) / range) * 100;
          const widthPct = ((day.tempMax - day.tempMin) / range) * 100;
          return (
            <div
              key={day.date}
              className={cn(
                'glass-card overflow-hidden transition-all',
                isOpen && 'border-aether-300/30 shadow-glow'
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="w-14 shrink-0">
                  <span className="block text-sm font-semibold text-white">
                    {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                  </span>
                  <span className="block text-[11px] text-white/45">
                    {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </span>
                <WeatherIcon condition={day.condition} isDay className="h-8 w-8 shrink-0" animate={false} />
                <span className="hidden flex-1 text-sm text-white/70 sm:block">{meta.label}</span>
                <span className="flex items-center gap-1 text-xs text-sky-300">
                  <Droplets className="h-3 w-3" />
                  {day.precipitationProbability}%
                </span>
                <div className="flex w-28 items-center gap-2 sm:w-40">
                  <span className="w-7 text-right text-sm text-white/60">{min}</span>
                  <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
                    <div
                      className="absolute h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                      style={{ left: `${startPct}%`, width: `${Math.max(8, widthPct)}%` }}
                    />
                  </div>
                  <span className="w-7 text-sm font-semibold text-white">{max}</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-white/50 transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-1 sm:grid-cols-4 animate-fade-in">
                  <Detail icon={<Thermometer className="h-4 w-4" />} label="High / Low" value={`${max}${tempUnitLabel(settings.tempUnit)} / ${min}${tempUnitLabel(settings.tempUnit)}`} />
                  <Detail icon={<Wind className="h-4 w-4" />} label="Wind" value={`${Math.round(convertWind(day.windSpeedMax, settings.windUnit))} ${windUnitLabel(settings.windUnit)}`} />
                  <Detail icon={<Sun className="h-4 w-4" />} label="UV Max" value={`${Math.round(day.uvIndexMax)}`} />
                  <Detail icon={<Droplets className="h-4 w-4" />} label="Precip." value={`${day.precipitationProbability}%`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
      <span className="text-aether-200">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}
