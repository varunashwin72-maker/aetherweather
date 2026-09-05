import { AlertTriangle, ShieldAlert, Info, Wind, Sun, Eye, Droplets, Thermometer } from 'lucide-react';
import type { WeatherAlert } from '@/types/weather';
import { cn } from '@/utils/cn';

interface Props {
  alerts: WeatherAlert[];
}

const SEVERITY_STYLE: Record<WeatherAlert['severity'], { color: string; bg: string; label: string }> = {
  extreme: { color: 'text-rose-300', bg: 'bg-rose-500/15 border-rose-400/30', label: 'Extreme' },
  severe: { color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30', label: 'Severe' },
  moderate: { color: 'text-yellow-200', bg: 'bg-yellow-500/10 border-yellow-400/20', label: 'Moderate' },
  minor: { color: 'text-sky-200', bg: 'bg-sky-500/10 border-sky-400/20', label: 'Minor' },
  unknown: { color: 'text-white/70', bg: 'bg-white/5 border-white/10', label: 'Advisory' },
};

const ICONS: Record<string, typeof Wind> = {
  'High UV Exposure': Sun,
  'High Wind Warning': Wind,
  'Extreme Heat': Thermometer,
  'Extreme Cold': Thermometer,
  'Low Visibility': Eye,
  'Heavy Rain Expected': Droplets,
};

export function AlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h3 className="font-display text-lg font-semibold text-white">No active alerts</h3>
        <p className="max-w-sm text-sm text-white/60">
          Conditions are stable for this location. We're monitoring for weather warnings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Weather Alerts</h2>
        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200">
          {alerts.length} active
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {alerts.map((a) => {
          const style = SEVERITY_STYLE[a.severity];
          const Icon = ICONS[a.title] ?? AlertTriangle;
          return (
            <div key={a.id} className={cn('glass-card flex items-start gap-3 border px-4 py-4', style.bg)}>
              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', style.bg, style.color)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{a.title}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', style.bg, style.color)}>
                    {style.label}
                  </span>
                </div>
                <p className="text-xs text-white/65">{a.description}</p>
                {a.areas && (
                  <span className="flex items-center gap-1 text-[11px] text-white/45">
                    <Info className="h-3 w-3" /> {a.areas}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
