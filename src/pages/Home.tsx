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

/** Panels ease in one after another instead of appearing all at once. */
function stagger(index: number): React.CSSProperties {
  return { animationDelay: `${index * 70}ms`, animationFillMode: 'both' };
}

export function Home({ data, settings, loading, lastUpdated, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-up" style={stagger(0)}>
        <HeroWeather
          data={data}
          settings={settings}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          isFavorite={false}
          onToggleFavorite={() => {}}
        />
      </div>

      <div className="animate-fade-up" style={stagger(1)}>
        <HourlyForecast hours={data.hourly} settings={settings} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up" style={stagger(2)}>
          <InsightsPanel data={data} />
        </div>
        <div className="animate-fade-up" style={stagger(3)}>
          <PrecipitationTimeline hourly={data.hourly} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up" style={stagger(4)}>
          <WindCompass current={data.current} settings={settings} />
        </div>
        <div className="animate-fade-up" style={stagger(5)}>
          <SunMoonPanel astronomy={data.astronomy} />
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="animate-fade-up" style={stagger(6)}>
          <AlertsPanel alerts={data.alerts} />
        </div>
      )}
    </div>
  );
}
