import { Home, CalendarDays, Radar, Map, Wind, Bell, Star, Settings } from 'lucide-react';
import type { NavId } from '@/components/navigation/Navbar';
import { cn } from '@/utils/cn';

const ITEMS: { id: NavId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'forecast', label: 'Forecast', icon: CalendarDays },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'maps', label: 'Maps', icon: Map },
  { id: 'air', label: 'Air', icon: Wind },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'favorites', label: 'Saved', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function MobileNav({ active, onChange }: { active: NavId; onChange: (id: NavId) => void }) {
  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between overflow-x-auto border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)] no-scrollbar lg:hidden"
      aria-label="Bottom navigation"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex min-w-[58px] flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition-colors',
              isActive ? 'text-aether-300' : 'text-white/55'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className={cn(
                'grid h-8 w-8 place-items-center rounded-xl transition-all',
                isActive ? 'bg-aether-500/20 shadow-glow' : 'bg-transparent'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
