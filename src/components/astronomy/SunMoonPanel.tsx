import { useMemo } from 'react';
import { Sunrise, Sunset, Sun } from 'lucide-react';
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

  // Ride the drawn arc (quadratic bezier M10,70 Q100,-10 190,70) so the sun stays
  // on the curve all day — the old straight-line sine put it off-canvas at noon.
  const sunX = bezierAt(10, 100, 190, dayProgress);
  const sunY = bezierAt(70, -10, 70, dayProgress);

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
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,212,122,0.75)" />
                <stop offset="100%" stopColor="rgba(255,212,122,0)" />
              </radialGradient>
            </defs>

            <path d="M10,70 Q100,-10 190,70" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <path
              d="M10,70 Q100,-10 190,70"
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2"
              strokeDasharray={`${dayProgress * 260} 260`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            {/* Light travelling along the day arc */}
            <path
              d="M10,70 Q100,-10 190,70"
              fill="none"
              stroke="rgba(255,236,190,0.75)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="26 234"
              className="arc-comet"
            />

            {/* Sun halo breathes as it tracks the arc */}
            <circle
              cx={sunX}
              cy={sunY}
              r="18"
              fill="url(#sunGlow)"
              className="animate-glow-pulse"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <circle
              cx={sunX}
              cy={sunY}
              r="6"
              fill="#ffd47a"
              className="drop-shadow-[0_0_10px_rgba(255,212,122,0.8)]"
              style={{ transition: 'cx 1s ease, cy 1s ease' }}
            />

            {/* Moon opposite the sun's position */}
            <g
              className="animate-float-slow"
              transform={`translate(${190 - (sunX - 10)},${sunY > 40 ? 24 : 40})`}
              opacity="0.85"
            >
              <circle r="5" fill="rgba(226,236,255,0.85)" className="drop-shadow-[0_0_8px_rgba(200,220,255,0.7)]" />
              <circle cx="2.4" cy="-1.4" r="4.6" fill="#0a1230" opacity="0.85" />
            </g>
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
    <div className="group flex items-center gap-2 transition-transform duration-300 hover:-translate-y-0.5">
      <span className="text-white/70 transition-transform duration-500 group-hover:scale-110">{icon}</span>
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
      {/* Halo breathes behind the disc */}
      <div className="absolute -inset-2 animate-glow-pulse rounded-full bg-slate-200/20 blur-lg" />

      <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-200">
        {/* Surface highlight drifts slowly, as if the moon were turning */}
        <div
          className="absolute -inset-4 animate-ring-spin opacity-40"
          style={{
            background:
              'radial-gradient(circle at 32% 34%, rgba(255,255,255,0.55), transparent 42%), radial-gradient(circle at 70% 66%, rgba(160,180,215,0.5), transparent 46%)',
          }}
        />
      </div>

      <div
        className="absolute inset-0 rounded-full transition-[clip-path] duration-700 ease-out"
        style={{
          background: '#0a1230',
          clipPath: isWaxing ? `inset(0 0 0 50%)` : `inset(0 50% 0 0)`,
        }}
      />
      <div
        className="absolute top-0 h-full rounded-full transition-transform duration-700 ease-out"
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

/** Point on a quadratic bezier at parameter t (0..1). */
function bezierAt(p0: number, p1: number, p2: number, t: number): number {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}
