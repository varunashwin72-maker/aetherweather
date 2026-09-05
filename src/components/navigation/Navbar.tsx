import { useEffect, useState } from 'react';
import { Cloud, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type NavId = 'home' | 'forecast' | 'radar' | 'maps' | 'air' | 'alerts' | 'favorites' | 'settings';

interface NavItem {
  id: NavId;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'radar', label: 'Radar' },
  { id: 'maps', label: 'Maps' },
  { id: 'air', label: 'Air Quality' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'settings', label: 'Settings' },
];

interface Props {
  active: NavId;
  onChange: (id: NavId) => void;
  rightSlot?: React.ReactNode;
}

export function Navbar({ active, onChange, rightSlot }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-all duration-300',
          scrolled ? 'glass-strong border-b border-white/10' : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button
            onClick={() => onChange('home')}
            className="flex items-center gap-2.5"
            aria-label="AetherWeather home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-aether-400 to-aether-600 shadow-glow">
              <Cloud className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              Aether<span className="text-aether-300">Weather</span>
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className={cn(
                  'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  active === item.id ? 'text-white' : 'text-white/60 hover:text-white'
                )}
              >
                {item.label}
                {active === item.id && (
                  <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-aether-300 to-transparent" />
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {rightSlot}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-xl glass text-white lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="glass-strong border-t border-white/10 px-4 py-3 lg:hidden animate-slide-down">
            <nav className="grid grid-cols-2 gap-2" aria-label="Mobile">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                    active === item.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
