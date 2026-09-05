import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  Settings,
  effectiveMotion,
  loadSettings,
  saveSettings,
} from '@/utils/formatters';

interface SettingsContextValue {
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  motion: 'off' | 'reduced' | 'full';
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());

  const setSettings = useCallback((s: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...s };
      saveSettings(next);
      return next;
    });
  }, []);

  const motion = useMemo(() => effectiveMotion(settings), [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else if (settings.theme === 'light') root.classList.remove('dark');
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, motion }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
