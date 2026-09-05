export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing-rain'
  | 'snow'
  | 'thunderstorm'
  | 'hail';

export type DayPart = 'day' | 'night';

export type AlertSeverity = 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';

export interface GeoLocation {
  id: string;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  dewPoint: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  cloudCover: number;
  uvIndex: number;
  precipitation: number;
  precipitationProbability: number;
  isDay: boolean;
  observedAt: number;
}

export interface HourForecast {
  time: number;
  temperature: number;
  apparentTemperature: number;
  condition: WeatherCondition;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DayForecast {
  date: number;
  condition: WeatherCondition;
  description: string;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  sunrise: number;
  sunset: number;
  humidity: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  startsAt: number;
  endsAt?: number;
  areas?: string;
  sender?: string;
}

export interface AirQuality {
  index: number;
  category: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  dust?: number;
}

export interface AstronomyData {
  sunrise: number;
  sunset: number;
  solarNoon: number;
  dayLength: number;
  moonrise?: number;
  moonset?: number;
  moonPhase: number;
  moonIllumination: number;
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourForecast[];
  daily: DayForecast[];
  alerts: WeatherAlert[];
  airQuality: AirQuality | null;
  astronomy: AstronomyData;
  fetchedAt: number;
}

export interface WeatherError {
  type: 'no-key' | 'api' | 'network' | 'not-found' | 'rate-limit' | 'permission' | 'unknown';
  message: string;
}
