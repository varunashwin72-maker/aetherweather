import { WeatherMap } from '@/components/maps/WeatherMap';
import type { GeoLocation, WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
  onSelectLocation?: (loc: GeoLocation) => void;
}

export function Maps({ data, onSelectLocation }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <WeatherMap location={data.location} onSelectLocation={onSelectLocation} />
    </div>
  );
}
