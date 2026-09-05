import { HeroWeather } from '@/components/weather/HeroWeather';
import { HourlyForecast } from '@/components/forecast/HourlyForecast';
import { InsightsPanel } from '@/components/weather/InsightsPanel';
import { WindCompass } from '@/components/weather/WindCompass';
import { PrecipitationTimeline } from '@/components/weather/PrecipitationTimeline';
import { SunMoonPanel } from '@/components/astronomy/SunMoonPanel';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import type { WeatherData } from '@/types/weather';
import type { Settings } from '@/utils/formatters';

interface Props {
  data: WeatherData;
  settings: Settings;
  loading: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
}

export function Home({ data, settings, loading, lastUpdated, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <HeroWeather
        data={data}
        settings={settings}
        loading={loading}
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        isFavorite={false}
        onToggleFavorite={() => {}}
      />

      <HourlyForecast hours={data.hourly} settings={settings} />

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightsPanel data={data} />
        <PrecipitationTimeline hourly={data.hourly} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WindCompass current={data.current} settings={settings} />
        <SunMoonPanel astronomy={data.astronomy} />
      </div>

      {data.alerts.length > 0 && <AlertsPanel alerts={data.alerts} />}
    </div>
  );
}
