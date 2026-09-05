import { Thermometer, Wind, Palette, Sparkles, RefreshCw, Bell, Eye, Moon } from 'lucide-react';
import type { Settings } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface Props {
  settings: Settings;
  onChange: (s: Partial<Settings>) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Settings</h2>
        <span className="text-xs text-white/50">Stored on this device</span>
      </div>

      <Section icon={<Thermometer className="h-4 w-4" />} title="Temperature">
        <Segmented
          value={settings.tempUnit}
          options={[{ v: 'celsius', l: 'Celsius °C' }, { v: 'fahrenheit', l: 'Fahrenheit °F' }]}
          onChange={(v) => onChange({ tempUnit: v as Settings['tempUnit'] })}
        />
      </Section>

      <Section icon={<Wind className="h-4 w-4" />} title="Wind">
        <Segmented
          value={settings.windUnit}
          options={[{ v: 'kmh', l: 'km/h' }, { v: 'mph', l: 'mph' }, { v: 'ms', l: 'm/s' }]}
          onChange={(v) => onChange({ windUnit: v as Settings['windUnit'] })}
        />
      </Section>

      <Section icon={<Palette className="h-4 w-4" />} title="Theme">
        <Segmented
          value={settings.theme}
          options={[{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }, { v: 'auto', l: 'Auto' }]}
          onChange={(v) => onChange({ theme: v as Settings['theme'] })}
        />
      </Section>

      <Section icon={<Sparkles className="h-4 w-4" />} title="Animations">
        <Segmented
          value={settings.animations}
          options={[{ v: 'full', l: 'Full' }, { v: 'reduced', l: 'Reduced' }, { v: 'off', l: 'Off' }]}
          onChange={(v) => onChange({ animations: v as Settings['animations'] })}
        />
        <p className="mt-2 text-xs text-white/45">
          Reduced motion is also applied automatically when your system requests it.
        </p>
      </Section>

      <Section icon={<Eye className="h-4 w-4" />} title="Background effects">
        <Toggle
          checked={settings.backgroundEffects}
          onChange={(v) => onChange({ backgroundEffects: v })}
          label="Animated weather background"
        />
      </Section>

      <Section icon={<RefreshCw className="h-4 w-4" />} title="Auto-refresh">
        <Segmented
          value={String(settings.autoRefreshMinutes)}
          options={[{ v: '5', l: '5 min' }, { v: '10', l: '10 min' }, { v: '30', l: '30 min' }]}
          onChange={(v) => onChange({ autoRefreshMinutes: Number(v) })}
        />
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <Toggle
          checked={settings.notifications}
          onChange={(v) => onChange({ notifications: v })}
          label="Weather alerts"
        />
        <p className="mt-2 text-xs text-white/45">
          Browser notifications require permission and will be requested when enabled.
        </p>
      </Section>

      <div className="glass-card flex items-center gap-3 px-4 py-3 text-xs text-white/50">
        <Moon className="h-4 w-4 text-aether-200" />
        AetherWeather stores your preferences and favorites locally on this device.
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center gap-2 text-white">
        <span className="text-aether-200">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all',
            value === o.v ? 'bg-aether-500/30 text-white shadow-glow' : 'text-white/60 hover:text-white'
          )}
          aria-pressed={value === o.v}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3"
      role="switch"
      aria-checked={checked}
    >
      <span className="text-sm text-white/80">{label}</span>
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-aether-500/60' : 'bg-white/10'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  );
}
