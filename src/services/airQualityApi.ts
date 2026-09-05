import type { AirQuality } from '@/types/weather';
import { aqiCategory } from '@/services/weatherApi';

export interface AqiBand {
  max: number;
  label: string;
  color: string;
  advice: string;
}

export const AQI_BANDS: AqiBand[] = [
  { max: 20, label: 'Good', color: '#22c55e', advice: 'Air quality is satisfactory and poses little or no risk.' },
  { max: 40, label: 'Fair', color: '#84cc16', advice: 'Acceptable air quality for most people.' },
  { max: 60, label: 'Moderate', color: '#eab308', advice: 'Unusually sensitive people should consider reducing prolonged outdoor exertion.' },
  { max: 80, label: 'Poor', color: '#f97316', advice: 'Sensitive groups should limit outdoor activity.' },
  { max: 100, label: 'Very Poor', color: '#ef4444', advice: 'Health warnings of emergency conditions.' },
  { max: 999, label: 'Extremely Poor', color: '#a21caf', advice: 'Everyone should avoid outdoor exertion.' },
];

export function aqiBandFor(value: number): AqiBand {
  return AQI_BANDS.find((b) => value <= b.max) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

export function aqiLabel(value: number): string {
  return aqiBandFor(value).label;
}

export { aqiCategory };
