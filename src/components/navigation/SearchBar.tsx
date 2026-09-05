import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, MapPin, X, Star, Clock } from 'lucide-react';
import type { GeoLocation } from '@/types/weather';
import { useLocationSearch } from '@/hooks/useLocation';
import { cn } from '@/utils/cn';

interface Props {
  onSelect: (loc: GeoLocation) => void;
  onUseCurrent: () => void;
  locating: boolean;
  recents: GeoLocation[];
  favorites: GeoLocation[];
  isFavorite: boolean;
  onToggleFavorite: (loc: GeoLocation | null) => void;
  className?: string;
}

export function SearchBar({
  onSelect,
  onUseCurrent,
  locating,
  recents,
  favorites,
  isFavorite,
  onToggleFavorite,
  className,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { results, loading, search } = useLocationSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      if (query.trim().length >= 2) search(query);
    }, 220);
    return () => clearTimeout(id);
  }, [query, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const list = results.length > 0 ? results : query.trim().length < 2 ? [...favorites, ...recents] : results;
  const flat = list.slice(0, 8);

  const choose = (loc: GeoLocation) => {
    onSelect(loc);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flat[activeIndex]) choose(flat[activeIndex]);
      else if (flat[0]) choose(flat[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'glass flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 transition-all',
          open && 'border-aether-300/40 shadow-glow'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-white/60" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search city or place..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          aria-label="Search location"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-aether-300" />}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onUseCurrent}
          className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Use current location"
          title="Use my location"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onToggleFavorite(null)}
          className={cn(
            'rounded-full p-1.5 hover:bg-white/10',
            isFavorite ? 'text-amber-300' : 'text-white/50 hover:text-white'
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-300')} />
        </button>
      </div>

      {open && flat.length > 0 && (
        <div className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-2xl border border-white/10 p-2 shadow-glass animate-slide-down">
          {results.length === 0 && favorites.length > 0 && (
            <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-white/40">Favorites</p>
          )}
          {results.length === 0 && favorites.length > 0 && favorites.map((loc) => (
            <ResultRow key={loc.id} loc={loc} icon={<Star className="h-3.5 w-3.5 text-amber-300" />} active={false} onClick={() => choose(loc)} />
          ))}
          {results.length === 0 && recents.length > 0 && (
            <p className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-white/40">Recent</p>
          )}
          {results.length === 0 && recents.length > 0 && recents.map((loc) => (
            <ResultRow key={loc.id} loc={loc} icon={<Clock className="h-3.5 w-3.5 text-white/40" />} active={false} onClick={() => choose(loc)} />
          ))}
          {results.length > 0 && results.slice(0, 8).map((loc, i) => (
            <ResultRow
              key={loc.id}
              loc={loc}
              icon={<MapPin className="h-3.5 w-3.5 text-aether-300" />}
              active={i === activeIndex}
              onClick={() => choose(loc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  loc,
  icon,
  active,
  onClick,
}: {
  loc: GeoLocation;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
        active ? 'bg-white/10' : 'hover:bg-white/5'
      )}
    >
      <span className="text-white/50">{icon}</span>
      <span className="flex-1">
        <span className="block text-white">{loc.name}</span>
        <span className="block text-xs text-white/50">
          {[loc.region, loc.country].filter(Boolean).join(', ') || `${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)}`}
        </span>
      </span>
    </button>
  );
}
