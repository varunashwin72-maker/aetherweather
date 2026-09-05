import { useMemo } from 'react';
import { Sunrise, Sunset, Sun, Moon } from 'lucide-react';
import type { AstronomyData } from '@/types/weather';
import { moonPhaseName } from '@/services/weatherApi';

interface Props {
  astronomy: AstronomyData;
}

export function SunMoonPanel({ astronomy }: Props) {
  const now = Date.now();
  const dayProgress = useMemo(() => {
    if (now < astronomy.sunrise) return 0;
    if (now > astronomy.sunset) return 1;
    return (now - astronomy.sunrise) / (astronomy.sunset - astronomy.sunrise);
  }, [astronomy, now]);

  const hours = Math.floor(astronomy.dayLength / 3600000);
  const minutes = Math.round((astronomy.dayLength % 3600000) / 60000);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Sun & Moon</h2>
      </div>

      <div className="glass-card relative overflow-hidden px-6 py-6">
        <div className="relative h-32">
          <svg viewBox="0 0 200 80" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,212,122,0.2)" />
                <stop offset="50%" stopColor="rgba(255,212,122,0.6)" />
                <stop offset="100%" stopColor="rgba(127,191,251,0.2)" />
              </linearGradient>
            </defs>
            <path d="M10,70 Q100,-10 190,70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path
              d="M10,70 Q100,-10 190,70"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2"
              strokeDasharray={`${dayProgress * 260} 260`}
            />
            <circle
              cx={10 + dayProgress * 180}
              cy={70 - Math.sin(dayProgress * Math.PI) * 80}
              r="6"
              fill="#ffd47a"
              className="drop-shadow-[0_0_10px_rgba(255,212,122,0.8)]"
            />
          </svg>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Stat icon={<Sunrise className="h-4 w-4 text-amber-300" />} label="Sunrise" value={formatTime(astronomy.sunrise)} />
          <Stat icon={<Sunset className="h-4 w-4 text-orange-300" />} label="Sunset" value={formatTime(astronomy.sunset)} />
          <Stat icon={<Sun className="h-4 w-4 text-amber-300" />} label="Solar Noon" value={formatTime(astronomy.solarNoon)} />
          <Stat icon={<Sun className="h-4 w-4 text-amber-200" />} label="Day Length" value={`${hours}h ${minutes}m`} />
        </div>
      </div>

      <div className="glass-card flex items-center gap-4 px-6 py-5">
        <MoonPhase phase={astronomy.moonPhase} illumination={astronomy.moonIllumination} />
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-white/45">Moon Phase</span>
          <span className="font-display text-lg font-semibold text-white">{moonPhaseName(astronomy.moonPhase)}</span>
          <span className="text-sm text-white/60">{astronomy.moonIllumination}% illuminated</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/70">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function MoonPhase({ phase, illumination }: { phase: number; illumination: number }) {
  // Render a moon with shadow based on phase (0..1)
  const r = 28;
  const offset = (1 - illumination / 100) * r * 2;
  const isWaxing = phase < 0.5;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="absolute inset-0 rounded-full bg-slate-200" />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: '#0a1230',
          clipPath: isWaxing ? `inset(0 0 0 50%)` : `inset(0 50% 0 0)`,
        }}
      />
      <div
        className="absolute top-0 h-full rounded-full"
        style={{
          width: '100%',
          background: '#0a1230',
          transform: `translateX(${isWaxing ? -offset : offset}px)`,
          opacity: 0.9,
          mixBlendMode: 'multiply',
        }}
      />
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_rgba(255,255,255,0.4)]" />
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
