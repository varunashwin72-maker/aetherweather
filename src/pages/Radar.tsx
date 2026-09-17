import { WeatherMap } from '@/components/maps/WeatherMap';
import { PrecipitationTimeline } from '@/components/weather/PrecipitationTimeline';
import type { GeoLocation, WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
  onSelectLocation?: (loc: GeoLocation) => void;
}

export function Radar({ data, onSelectLocation }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <WeatherMap location={data.location} onSelectLocation={onSelectLocation} />
      <PrecipitationTimeline hourly={data.hourly} />
    </div>
  );
}
