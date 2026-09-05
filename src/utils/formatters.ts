export type UnitSystem = 'metric' | 'imperial';
export type TempUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'mph' | 'ms';
export type ThemeMode = 'auto' | 'dark' | 'light';
export type AnimationIntensity = 'off' | 'reduced' | 'full';

export interface Settings {
  tempUnit: TempUnit;
  windUnit: WindUnit;
  theme: ThemeMode;
  animations: AnimationIntensity;
  backgroundEffects: boolean;
  autoRefreshMinutes: number;
  notifications: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tempUnit: 'celsius',
  windUnit: 'kmh',
  theme: 'dark',
  animations: 'full',
  backgroundEffects: true,
  autoRefreshMinutes: 10,
  notifications: false,
};

export const SETTINGS_KEY = 'aether.settings.v1';
export const FAVORITES_KEY = 'aether.favorites.v1';
export const RECENTS_KEY = 'aether.recents.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

export function convertTemp(celsius: number, unit: TempUnit): number {
  return unit === 'fahrenheit' ? celsius * (9 / 5) + 32 : celsius;
}

export function convertWind(kmh: number, unit: WindUnit): number {
  if (unit === 'mph') return kmh * 0.621371;
  if (unit === 'ms') return kmh / 3.6;
  return kmh;
}

export function tempUnitLabel(unit: TempUnit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function windUnitLabel(unit: WindUnit): string {
  if (unit === 'mph') return 'mph';
  if (unit === 'ms') return 'm/s';
  return 'km/h';
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function effectiveMotion(settings: Settings): 'off' | 'reduced' | 'full' {
  if (settings.animations === 'off') return 'off';
  if (prefersReducedMotion() || settings.animations === 'reduced') return 'reduced';
  return 'full';
}
