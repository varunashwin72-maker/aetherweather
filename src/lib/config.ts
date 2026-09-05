const ENV = import.meta.env;

export const config = {
  weatherApiKey: (ENV.VITE_WEATHER_API_KEY as string | undefined) ?? '',
  mapApiKey: (ENV.VITE_MAP_API_KEY as string | undefined) ?? '',
  airQualityApiKey: (ENV.VITE_AIR_QUALITY_API_KEY as string | undefined) ?? '',
  weatherApiProvider: ((ENV.VITE_WEATHER_API_PROVIDER as string | undefined) ?? 'open-meteo') as
    | 'open-meteo'
    | 'openweather',
  isWeatherConfigured: Boolean(ENV.VITE_WEATHER_API_KEY) || true,
};

export const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
export const OPEN_METEO_GEO_BASE = 'https://geocoding-api.open-meteo.com/v1';
export const OPEN_METEO_AIR_BASE = 'https://air-quality-api.open-meteo.com/v1';

export const OPENWEATHER_BASE = 'https://api.openweathermap.org';
export const OPENWEATHER_GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
export const OPENWEATHER_DATA_BASE = 'https://api.openweathermap.org/data/3.0';
export const OPENWEATHER_DATA2_BASE = 'https://api.openweathermap.org/data/2.5';
