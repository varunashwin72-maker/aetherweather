import type { AirQuality } from '@/types/weather';
import { AQI_BANDS, aqiBandFor } from '@/services/airQualityApi';
import { cn } from '@/utils/cn';

interface Props {
  air: AirQuality;
}

const POLLUTANTS: { key: keyof AirQuality; label: string; unit: string }[] = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { key: 'co', label: 'CO', unit: 'µg/m³' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³' },
  { key: 'o3', label: 'O₃', unit: 'µg/m³' },
  { key: 'so2', label: 'SO₂', unit: 'µg/m³' },
];

export function AirQualityPanel({ air }: Props) {
  const band = aqiBandFor(air.index);
  const pct = Math.min(100, (air.index / 100) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Air Quality</h2>
        <span className="text-xs text-white/50">European AQI</span>
      </div>

      <div className="glass-card flex flex-col items-center gap-4 px-6 py-6">
        <div className="relative grid h-36 w-36 place-items-center">
          <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={band.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 327} 327`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-4xl font-semibold text-white">{Math.round(air.index)}</span>
            <span className="text-xs" style={{ color: band.color }}>{band.label}</span>
          </div>
        </div>
        <p className="max-w-xs text-center text-sm text-white/65">{band.advice}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {POLLUTANTS.map((p) => (
          <div key={p.key} className="glass-card flex flex-col gap-1 px-3 py-3">
            <span className="text-[11px] uppercase tracking-wider text-white/45">{p.label}</span>
            <span className="text-lg font-semibold text-white">{Math.round(air[p.key] as number)}</span>
            <span className="text-[10px] text-white/40">{p.unit}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-1 px-1">
        {AQI_BANDS.map((b) => (
          <span
            key={b.label}
            className={cn('h-1.5 flex-1 rounded-full')}
            style={{ background: b.color, opacity: b.label === band.label ? 1 : 0.35 }}
          />
        ))}
      </div>
      <div className="flex justify-between px-1 text-[10px] text-white/40">
        <span>Good</span>
        <span>Extremely Poor</span>
      </div>
    </div>
  );
}
