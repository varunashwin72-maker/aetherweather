import { useMemo } from 'react';
import type { CurrentWeather } from '@/types/weather';
import type { Settings } from '@/utils/formatters';
import { convertWind, windUnitLabel } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface Props {
  current: CurrentWeather;
  settings: Settings;
}

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function WindCompass({ current, settings }: Props) {
  const speed = Math.round(convertWind(current.windSpeed, settings.windUnit));
  const gusts = Math.round(convertWind(current.windGusts, settings.windUnit));
  const dir = current.windDirection;
  const cardinal = useMemo(() => COMPASS_POINTS[Math.round(dir / 22.5) % 16], [dir]);

  return (
    <div className="glass-card flex flex-col items-center gap-4 px-6 py-6">
      <div className="relative grid h-44 w-44 place-items-center">
        <svg viewBox="0 0 120 120" className="h-44 w-44">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {COMPASS_POINTS.map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            const x1 = 60 + Math.cos(angle) * 52;
            const y1 = 60 + Math.sin(angle) * 52;
            const x2 = 60 + Math.cos(angle) * (i % 2 === 0 ? 46 : 49);
            const y2 = 60 + Math.sin(angle) * (i % 2 === 0 ? 46 : 49);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth={i % 2 === 0 ? 1 : 0.5} />;
          })}
          {['N', 'E', 'S', 'W'].map((p, i) => {
            const angle = (i * 90 - 90) * (Math.PI / 180);
            const x = 60 + Math.cos(angle) * 36;
            const y = 60 + Math.sin(angle) * 36 + 3;
            return (
              <text key={p} x={x} y={y} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontWeight="600">
                {p}
              </text>
            );
          })}
          <g transform={`rotate(${dir} 60 60)`} style={{ transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
            <path d="M60,16 L54,60 L60,54 L66,60 Z" fill="#7fc1f5" className="drop-shadow-[0_0_6px_rgba(127,191,251,0.7)]" />
            <path d="M60,104 L54,60 L60,66 L66,60 Z" fill="rgba(255,255,255,0.3)" />
            <circle cx="60" cy="60" r="4" fill="#fff" />
          </g>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display text-2xl font-semibold text-white">{speed}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/45">{windUnitLabel(settings.windUnit)}</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-white/45">Direction</span>
          <span className="text-sm font-semibold text-white">{cardinal} · {Math.round(dir)}°</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider text-white/45">Gusts</span>
          <span className="text-sm font-semibold text-white">{gusts} {windUnitLabel(settings.windUnit)}</span>
        </div>
      </div>
    </div>
  );
}
