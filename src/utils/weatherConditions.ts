import type { WeatherCondition } from '@/types/weather';

export interface ConditionMeta {
  label: string;
  description: string;
}

const META: Record<WeatherCondition, ConditionMeta> = {
  clear: { label: 'Clear', description: 'Clear skies' },
  'partly-cloudy': { label: 'Partly Cloudy', description: 'Partly cloudy skies' },
  cloudy: { label: 'Cloudy', description: 'Mostly cloudy' },
  overcast: { label: 'Overcast', description: 'Overcast skies' },
  fog: { label: 'Fog', description: 'Foggy conditions' },
  drizzle: { label: 'Drizzle', description: 'Light drizzle' },
  rain: { label: 'Rain', description: 'Rain showers' },
  'freezing-rain': { label: 'Freezing Rain', description: 'Freezing rain' },
  snow: { label: 'Snow', description: 'Snowfall' },
  thunderstorm: { label: 'Thunderstorm', description: 'Thunderstorms' },
  hail: { label: 'Hail', description: 'Hail showers' },
};

export function conditionMeta(c: WeatherCondition): ConditionMeta {
  return META[c] ?? META['partly-cloudy'];
}

export function conditionFromCodes(
  code: number,
  isDay = true,
  precipitationIntensity = 0
): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1) return 'partly-cloudy';
  if (code === 2) return 'cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 65) return precipitationIntensity > 6 ? 'rain' : 'rain';
  if (code === 66 || code === 67) return 'freezing-rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return isDay ? 'partly-cloudy' : 'partly-cloudy';
}

export function weatherIconKey(c: WeatherCondition, isDay = true): string {
  switch (c) {
    case 'clear':
      return isDay ? 'sun' : 'moon';
    case 'partly-cloudy':
      return isDay ? 'cloud-sun' : 'cloud-moon';
    case 'cloudy':
    case 'overcast':
      return 'cloud';
    case 'fog':
      return 'fog';
    case 'drizzle':
      return 'drizzle';
    case 'rain':
    case 'freezing-rain':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'thunderstorm':
      return 'thunderstorm';
    case 'hail':
      return 'hail';
    default:
      return 'cloud';
  }
}
