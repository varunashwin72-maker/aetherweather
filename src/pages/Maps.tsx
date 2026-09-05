import { WeatherMap } from '@/components/maps/WeatherMap';
import type { WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
}

export function Maps({ data }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <WeatherMap location={data.location} />
    </div>
  );
}
