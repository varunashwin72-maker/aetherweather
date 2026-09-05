import { useEffect, useRef } from 'react';
import type { WeatherCondition } from '@/types/weather';
import { scenePalette, sceneEffectType } from '@/animations/weatherEffects';

interface Props {
  condition: WeatherCondition;
  isDay: boolean;
  motion: 'off' | 'reduced' | 'full';
  enabled: boolean;
}

type EffectType = ReturnType<typeof sceneEffectType>;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  layer: number;
  twinkle: number;
}

interface Lightning {
  active: boolean;
  alpha: number;
  nextAt: number;
  bolt: { x: number; y: number; segs: { x: number; y: number }[] } | null;
}

export function WeatherBackground({ condition, isDay, motion, enabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef<{
    w: number;
    h: number;
    dpr: number;
    particles: Particle[];
    clouds: { x: number; y: number; scale: number; speed: number; alpha: number }[];
    stars: { x: number; y: number; r: number; tw: number }[];
    lightning: Lightning;
    time: number;
    type: EffectType;
    palette: ReturnType<typeof scenePalette>;
    motion: 'off' | 'reduced' | 'full';
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const type = sceneEffectType(condition);
    const palette = scenePalette(condition, isDay);
    const reduce = motion === 'off' ? 'reduced' : motion;

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const particles: Particle[] = [];
      const clouds: { x: number; y: number; scale: number; speed: number; alpha: number }[] = [];
      const stars: { x: number; y: number; r: number; tw: number }[] = [];

      const area = w * h;
      const density = reduce === 'reduced' ? 0.5 : 1;

      if (type === 'rain' || type === 'thunder') {
        const count = Math.min(420, Math.floor(area / 3200) * density);
        for (let i = 0; i < count; i++) {
          const layer = Math.random();
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -1.2 - layer * 1.5,
            vy: 9 + layer * 16,
            r: 0.6 + layer * 1.1,
            a: 0.25 + layer * 0.5,
            layer,
            twinkle: 0,
          });
        }
      } else if (type === 'snow') {
        const count = Math.min(220, Math.floor(area / 6000) * density);
        for (let i = 0; i < count; i++) {
          const layer = Math.random();
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.6,
            vy: 0.6 + layer * 1.8,
            r: 1 + layer * 2.6,
            a: 0.4 + layer * 0.5,
            layer,
            twinkle: Math.random() * Math.PI * 2,
          });
        }
      } else if (type === 'fog' || type === 'clouds') {
        const count = type === 'fog' ? 6 : 7;
        for (let i = 0; i < count; i++) {
          clouds.push({
            x: Math.random() * w,
            y: h * (0.1 + Math.random() * 0.7),
            scale: 1.2 + Math.random() * 2.4,
            speed: (0.12 + Math.random() * 0.22) * (Math.random() > 0.5 ? 1 : -1),
            alpha: 0.18 + Math.random() * 0.22,
          });
        }
      } else if (type === 'stars') {
        const count = Math.min(180, Math.floor(area / 7000) * density);
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.8,
            r: Math.random() * 1.4 + 0.3,
            tw: Math.random() * Math.PI * 2,
          });
        }
      } else if (type === 'clear' && isDay) {
        const count = Math.min(40, Math.floor(area / 30000) * density);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -0.1 - Math.random() * 0.3,
            r: 1 + Math.random() * 2,
            a: 0.1 + Math.random() * 0.25,
            layer: Math.random(),
            twinkle: Math.random() * Math.PI * 2,
          });
        }
      }

      stateRef.current = {
        w,
        h,
        dpr,
        particles,
        clouds,
        stars,
        lightning: { active: false, alpha: 0, nextAt: performance.now() + 2500 + Math.random() * 4000, bolt: null },
        time: 0,
        type,
        palette,
        motion: reduce,
      };
    };

    setup();

    const drawGradient = () => {
      const s = stateRef.current!;
      const { w, h, palette: p } = s;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, p.skyTop);
      g.addColorStop(0.55, p.skyMid);
      g.addColorStop(1, p.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Aurora / glow blobs for depth
      if (s.type === 'clear' || s.type === 'stars') {
        const cx = w * (0.7 + Math.sin(s.time / 9000) * 0.05);
        const cy = h * (isDay ? 0.18 : 0.22);
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
        rg.addColorStop(0, hexA(p.glow, isDay ? 0.5 : 0.35));
        rg.addColorStop(1, hexA(p.glow, 0));
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, w, h);
      } else if (s.type === 'aurora') {
        drawAurora(ctx, s);
      }
    };

    const drawAurora = (ctx: CanvasRenderingContext2D, s: NonNullable<typeof stateRef.current>) => {
      const { w, h, time, palette: p } = s;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const yBase = h * (0.2 + i * 0.12);
        const amp = 40 + i * 20;
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= w; x += 24) {
          const y = yBase + Math.sin((x / 220) + time / 1400 + i) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp + 80);
        g.addColorStop(0, hexA(p.accent, 0));
        g.addColorStop(0.5, hexA(p.accent, 0.18 - i * 0.04));
        g.addColorStop(1, hexA(p.accent, 0));
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawSunMoon = () => {
      const s = stateRef.current!;
      const { w, h, palette: p } = s;
      const cx = w * 0.78;
      const cy = h * 0.2;
      const r = isDay ? 70 : 52;
      ctx.save();
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
      glow.addColorStop(0, hexA(p.glow, isDay ? 0.85 : 0.6));
      glow.addColorStop(1, hexA(p.glow, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isDay ? '#fff6d8' : '#eef3ff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawStars = () => {
      const s = stateRef.current!;
      const { stars, time } = s;
      ctx.save();
      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(time / 700 + st.tw);
        ctx.globalAlpha = 0.4 + tw * 0.5;
        ctx.fillStyle = '#eaf2ff';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawClouds = () => {
      const s = stateRef.current!;
      const { clouds, w, h, palette: p, time, motion: m } = s;
      ctx.save();
      for (const c of clouds) {
        if (m !== 'off') {
          c.x += c.speed;
          if (c.x > w + 200) c.x = -200;
          if (c.x < -200) c.x = w + 200;
        }
        const baseR = 90 * c.scale;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, baseR);
        const col = p.skyBottom;
        g.addColorStop(0, hexA(col, c.alpha));
        g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, baseR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      void time;
      void h;
    };

    const drawRain = () => {
      const s = stateRef.current!;
      const { particles, w, h, motion: m } = s;
      ctx.save();
      ctx.strokeStyle = 'rgba(200,220,255,0.5)';
      ctx.lineCap = 'round';
      for (const p of particles) {
        if (m !== 'off') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > h) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
        }
        ctx.globalAlpha = p.a;
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.4, p.y - p.vy * 1.4);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSnow = () => {
      const s = stateRef.current!;
      const { particles, w, h, motion: m, time } = s;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const p of particles) {
        if (m !== 'off') {
          p.x += p.vx + Math.sin(time / 900 + p.twinkle) * 0.4;
          p.y += p.vy;
          if (p.y > h) {
            p.y = -10;
            p.x = Math.random() * w;
          }
        }
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawFog = () => {
      drawClouds();
    };

    const drawLightning = () => {
      const s = stateRef.current!;
      const { lightning, w, h, time, motion: m } = s;
      if (m === 'off') return;
      if (!lightning.active && time > lightning.nextAt) {
        lightning.active = true;
        lightning.alpha = 1;
        const x = Math.random() * w;
        const segs: { x: number; y: number }[] = [];
        let cx = x;
        let cy = 0;
        while (cy < h * 0.7) {
          cx += (Math.random() - 0.5) * 60;
          cy += 40 + Math.random() * 50;
          segs.push({ x: cx, y: cy });
        }
        lightning.bolt = { x, y: 0, segs };
        lightning.nextAt = time + 3500 + Math.random() * 5000;
      }
      if (lightning.active) {
        ctx.save();
        ctx.fillStyle = hexA('#cfe0ff', lightning.alpha * 0.18);
        ctx.fillRect(0, 0, w, h);
        if (lightning.bolt && lightning.alpha > 0.4) {
          ctx.strokeStyle = hexA('#eaf2ff', lightning.alpha);
          ctx.lineWidth = 2.2;
          ctx.shadowColor = '#bcd2ff';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(lightning.bolt.x, lightning.bolt.y);
          for (const seg of lightning.bolt.segs) ctx.lineTo(seg.x, seg.y);
          ctx.stroke();
        }
        ctx.restore();
        lightning.alpha -= 0.05;
        if (lightning.alpha <= 0) {
          lightning.active = false;
          lightning.bolt = null;
        }
      }
    };

    const render = (t: number) => {
      const s = stateRef.current!;
      s.time = t;
      drawGradient();
      if (s.type === 'stars') drawStars();
      if (s.type === 'clear' || s.type === 'stars') drawSunMoon();
      if (s.type === 'clear' && isDay) {
        // floating particles
        for (const p of s.particles) {
          if (s.motion !== 'off') {
            p.x += p.vx;
            p.y += p.vy;
            if (p.y < -10) {
              p.y = s.h + 10;
              p.x = Math.random() * s.w;
            }
          }
          ctx.globalAlpha = p.a;
          ctx.fillStyle = hexA(s.palette.glow, 0.8);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (s.type === 'clouds' || s.type === 'fog') drawFog();
      if (s.type === 'rain') drawRain();
      if (s.type === 'snow') drawSnow();
      if (s.type === 'thunder') {
        drawRain();
        drawLightning();
      }
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    const onResize = () => setup();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [condition, isDay, motion, enabled]);

  if (!enabled) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(180deg, ${scenePalette(condition, isDay).skyTop}, ${scenePalette(
            condition,
            isDay
          ).skyMid} 55%, ${scenePalette(condition, isDay).skyBottom})`,
        }}
      />
    );
  }

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 h-full w-full" aria-hidden="true" />;
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
