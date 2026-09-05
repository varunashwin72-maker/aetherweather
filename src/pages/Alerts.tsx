import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import type { WeatherData } from '@/types/weather';

interface Props {
  data: WeatherData;
}

export function Alerts({ data }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <AlertsPanel alerts={data.alerts} />
    </div>
  );
}
