import { Loader2, Pause, Play, Radio } from 'lucide-react';
import type { RadarFrame } from '@/services/radarApi';
import { cn } from '@/utils/cn';

interface Props {
  frames: RadarFrame[];
  index: number;
  playing: boolean;
  loading: boolean;
  /** Human-readable time of the frame on screen, e.g. "14:20 · 30 min ago". */
  label: string;
  onTogglePlay: () => void;
  onScrub: (index: number) => void;
}

/**
 * Playback bar for the animated radar: play/pause, a scrubber across the
 * frame history (past frames followed by the short nowcast) and the time of
 * the frame currently on the map.
 */
export function RadarControls({
  frames,
  index,
  playing,
  loading,
  label,
  onTogglePlay,
  onScrub,
}: Props) {
  const last = Math.max(0, frames.length - 1);
  const frame = frames[index];
  const forecast = frame?.nowcast ?? false;

  return (
    <div className="glass-strong flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-2 shadow-lg">
      <button
        onClick={onTogglePlay}
        disabled={frames.length < 2}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aether-500/30 text-white transition hover:bg-aether-500/50 disabled:opacity-40"
        aria-label={playing ? 'Pause radar animation' : 'Play radar animation'}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={last}
        value={index}
        onChange={(e) => onScrub(Number(e.target.value))}
        onPointerDown={() => playing && onTogglePlay()}
        className="radar-scrubber min-w-0 flex-1 cursor-pointer"
        aria-label="Radar timeline"
      />

      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          forecast ? 'bg-accent-500/25 text-accent-400' : 'bg-aether-500/25 text-aether-200'
        )}
      >
        {forecast ? 'Forecast' : 'Past'}
      </span>

      <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/80">{label}</span>

      <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
        <Radio className={cn('h-3.5 w-3.5', playing && 'animate-radar-pulse')} />
        Live
      </span>
    </div>
  );
}
