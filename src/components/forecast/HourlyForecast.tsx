import { useMemo, useRef, useState } from 'react';
import type { HourForecast } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertTemp, convertWind, tempUnitLabel, windUnitLabel } from '@/utils/formatters';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { cn } from '@/utils/cn';

interface Props {
  hours: HourForecast[];
  settings: Settings;
}

export function HourlyForecast({ hours, settings }: Props) {
  const [selected, setSelected] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slice = hours.slice(0, 24);

  const temps = slice.map((h) => convertTemp(h.temperature, settings.tempUnit));
  const { min, max } = useMemo(() => {
    if (temps.length === 0) return { min: 0, max: 1 };
    const mn = Math.min(...temps);
    const mx = Math.max(...temps);
    return { min: mn, max: mx === mn ? mn + 1 : mx };
  }, [temps]);

  const sel = slice[selected];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Hourly Forecast</h2>
        <span className="text-xs text-white/50">Next 24 hours</span>
      </div>

      <TempGraph hours={slice} settings={settings} min={min} max={max} selected={selected} onSelect={setSelected} />

      <div
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
        role="listbox"
        aria-label="Hourly forecast"
      >
        {slice.map((h, i) => {
          const temp = Math.round(convertTemp(h.temperature, settings.tempUnit));
          const isSel = i === selected;
          return (
            <button
              key={h.time}
              onClick={() => setSelected(i)}
              role="option"
              aria-selected={isSel}
              className={cn(
                'flex min-w-[78px] flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center transition-all',
                isSel
                  ? 'glass-strong border-aether-300/40 shadow-glow'
                  : 'glass border-white/10 hover:border-white/20'
              )}
            >
              <span className="text-[11px] font-medium text-white/60">
                {i === 0 ? 'Now' : new Date(h.time).toLocaleTimeString([], { hour: 'numeric' })}
              </span>
              <WeatherIcon condition={h.condition} isDay={h.isDay} className="h-7 w-7" animate={false} />
              <span className="text-base font-semibold text-white">{temp}{tempUnitLabel(settings.tempUnit)}</span>
              <span className="flex items-center gap-0.5 text-[10px] text-sky-300">
                <span className="h-1 w-1 rounded-full bg-sky-300" />
                {h.precipitationProbability}%
              </span>
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="glass-card grid grid-cols-3 gap-3 px-4 py-4 text-center sm:grid-cols-5">
          <Detail label="Feels" value={`${Math.round(convertTemp(sel.apparentTemperature, settings.tempUnit))}${tempUnitLabel(settings.tempUnit)}`} />
          <Detail label="Wind" value={`${Math.round(convertWind(sel.windSpeed, settings.windUnit))} ${windUnitLabel(settings.windUnit)}`} />
          <Detail label="Gusts" value={`${Math.round(convertWind(sel.windGusts, settings.windUnit))} ${windUnitLabel(settings.windUnit)}`} />
          <Detail label="Humidity" value={`${sel.humidity}%`} />
          <Detail label="Precip." value={`${sel.precipitationProbability}%`} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function TempGraph({
  hours,
  settings,
  min,
  max,
  selected,
  onSelect,
}: {
  hours: HourForecast[];
  settings: Settings;
  min: number;
  max: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const width = 100;
  const height = 48;
  const n = hours.length;
  const range = max - min || 1;
  const points = hours.map((h, i) => {
    const t = convertTemp(h.temperature, settings.tempUnit);
    const x = (i / (n - 1)) * width;
    const y = height - ((t - min) / range) * (height - 6) - 3;
    return { x, y, t };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <div className="glass-card relative overflow-hidden px-4 py-3">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-20 w-full" role="img" aria-label="Temperature trend">
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(127,191,251,0.45)" />
            <stop offset="100%" stopColor="rgba(127,191,251,0)" />
          </linearGradient>
          <linearGradient id="tempLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7fc1f5" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tempFill)" />
        <path d={path} fill="none" stroke="url(#tempLine)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <g key={i} onClick={() => onSelect(i)} className="cursor-pointer">
            <rect x={p.x - width / n / 2} y={0} width={width / n} height={height} fill="transparent" />
            {i === selected && <circle cx={p.x} cy={p.y} r="0.9" fill="#fff" stroke="#7fc1f5" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />}
          </g>
        ))}
      </svg>
    </div>
  );
}
