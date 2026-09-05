import { CloudRain, Sun, Wind, Thermometer, Smile, Cloud, Sparkles, Umbrella } from 'lucide-react';
import type { WeatherData } from '@/types/weather';
import { generateInsights } from '@/utils/insights';
import { cn } from '@/utils/cn';

const ICONS: Record<string, typeof Sun> = {
  rain: CloudRain,
  'cloud-rain': CloudRain,
  sun: Sun,
  wind: Wind,
  thermometer: Thermometer,
  smile: Smile,
  cloud: Cloud,
  sparkles: Sparkles,
  umbrella: Umbrella,
};

export function InsightsPanel({ data }: { data: WeatherData }) {
  const insights = generateInsights(data);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Weather Insights</h2>
        <span className="flex items-center gap-1 text-xs text-white/50">
          <Sparkles className="h-3 w-3 text-aether-300" />
          Generated from forecast
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins) => {
          const Icon = ICONS[ins.icon] ?? Sparkles;
          return (
            <div
              key={ins.id}
              className={cn(
                'glass-card flex items-start gap-3 px-4 py-4',
                ins.tone === 'warn' && 'border-amber-300/20',
                ins.tone === 'good' && 'border-emerald-300/20'
              )}
            >
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                  ins.tone === 'warn' && 'bg-amber-400/15 text-amber-300',
                  ins.tone === 'good' && 'bg-emerald-400/15 text-emerald-300',
                  ins.tone === 'info' && 'bg-aether-400/15 text-aether-200'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white">{ins.title}</span>
                <span className="text-xs text-white/60">{ins.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
