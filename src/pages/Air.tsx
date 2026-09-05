import { AirQualityPanel } from '@/components/air-quality/AirQualityPanel';
import { ErrorState } from '@/components/ui/ErrorState';
import type { WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
}

export function Air({ data }: Props) {
  if (!data.airQuality) {
    return (
      <ErrorState
        title="Air quality unavailable"
        message="Air quality data could not be loaded for this location. Try another city or refresh later."
      />
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <AirQualityPanel air={data.airQuality} />
    </div>
  );
}
