import { Star, X, MapPin, GripVertical } from 'lucide-react';
import type { GeoLocation } from '@/types/weather';
import { cn } from '@/utils/cn';

interface Props {
  favorites: GeoLocation[];
  activeId?: string;
  onSelect: (loc: GeoLocation) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

export function FavoritesPanel({ favorites, activeId, onSelect, onRemove, onReorder }: Props) {
  if (favorites.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-400/15 text-amber-300">
          <Star className="h-6 w-6" />
        </span>
        <h3 className="font-display text-lg font-semibold text-white">No favorite locations yet</h3>
        <p className="max-w-sm text-sm text-white/60">
          Search for a city and tap the star to save it here for quick access.
        </p>
      </div>
    );
  }

  let dragIndex = -1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold text-white">Favorite Locations</h2>
        <span className="text-xs text-white/50">Drag to reorder</span>
      </div>
      <div className="flex flex-col gap-2">
        {favorites.map((loc, i) => (
          <div
            key={loc.id}
            draggable
            onDragStart={() => (dragIndex = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex >= 0 && dragIndex !== i) onReorder(dragIndex, i);
              dragIndex = -1;
            }}
            className={cn(
              'glass-card flex items-center gap-3 px-4 py-3 transition-all',
              activeId === loc.id && 'border-aether-300/40 shadow-glow'
            )}
          >
            <GripVertical className="h-4 w-4 cursor-grab text-white/30" />
            <button onClick={() => onSelect(loc)} className="flex flex-1 items-center gap-3 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-aether-500/15 text-aether-200">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-white">{loc.name}</span>
                <span className="text-xs text-white/50">
                  {[loc.region, loc.country].filter(Boolean).join(', ')}
                </span>
              </span>
            </button>
            <button
              onClick={() => onRemove(loc.id)}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40 hover:bg-white/10 hover:text-rose-300"
              aria-label={`Remove ${loc.name} from favorites`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
