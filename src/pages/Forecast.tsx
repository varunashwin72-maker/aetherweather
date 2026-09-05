import { HourlyForecast } from '@/components/forecast/HourlyForecast';
import { DailyForecast } from '@/components/forecast/DailyForecast';
import { SunMoonPanel } from '@/components/astronomy/SunMoonPanel';
import type { WeatherData } from '@/types/weather';
import type { Settings } from '@/utils/formatters';

interface Props {
  data: WeatherData;
  settings: Settings;
}

export function Forecast({ data, settings }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <HourlyForecast hours={data.hourly} settings={settings} />
      <DailyForecast days={data.daily} settings={settings} />
      <SunMoonPanel astronomy={data.astronomy} />
    </div>
  );
}
