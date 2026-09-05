import { Droplets, Clock } from 'lucide-react';
import type { HourForecast } from '@/types/weather';
import { minutesUntilRain, precipitationTimeline } from '@/utils/insights';
import { cn } from '@/utils/cn';

interface Props {
  hourly: HourForecast[];
}

export function PrecipitationTimeline({ hourly }: Props) {
  const minutes = minutesUntilRain(hourly);
  const timeline = precipitationTimeline(hourly, 12);
  const maxProb = Math.max(1, ...timeline.map((t) => t.probability));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Precipitation</h2>
        <span className="text-xs text-white/50">Next 12 hours</span>
      </div>

      {minutes !== null && minutes <= 120 && (
        <div className="glass-card flex items-center gap-3 border-sky-300/30 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sky-400/20 text-sky-200">
            <Clock className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Rain expected in {minutes} min</span>
            <span className="text-xs text-white/55">Precipitation probability rising soon</span>
          </div>
        </div>
      )}

      <div className="glass-card px-5 py-5">
        <div className="flex items-end justify-between gap-1">
          {timeline.map((t, i) => {
            const h = (t.probability / maxProb) * 100;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-white/50">{t.probability}%</span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn(
                      'w-full rounded-t-md bg-gradient-to-t from-sky-500/40 to-sky-300/80 transition-all',
                      t.probability >= 60 && 'from-sky-400/60 to-sky-200'
                    )}
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/45">
                  {new Date(t.time).toLocaleTimeString([], { hour: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 px-4 py-3">
        <Droplets className="h-5 w-5 text-sky-300" />
        <span className="text-sm text-white/70">
          {minutes !== null
            ? 'Wet weather is on the way — consider an umbrella.'
            : 'No significant precipitation expected in the next 12 hours.'}
        </span>
      </div>
    </div>
  );
}
