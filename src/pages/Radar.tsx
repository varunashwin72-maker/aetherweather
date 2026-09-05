import { WeatherMap } from '@/components/maps/WeatherMap';
import { PrecipitationTimeline } from '@/components/weather/PrecipitationTimeline';
import type { WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
}

export function Radar({ data }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <WeatherMap location={data.location} />
      <PrecipitationTimeline hourly={data.hourly} />
    </div>
  );
}
