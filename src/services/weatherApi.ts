import type {
  AirQuality,
  AstronomyData,
  CurrentWeather,
  DayForecast,
  GeoLocation,
  HourForecast,
  WeatherAlert,
  WeatherCondition,
  WeatherData,
} from '@/types/weather';
import { ApiError, safeFetchJson } from '@/lib/api';
import { OPEN_METEO_AIR_BASE, OPEN_METEO_BASE } from '@/lib/config';
import { conditionFromCodes, conditionMeta } from '@/utils/weatherConditions';

interface OMCurrent {
  time: string;
  interval?: number;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  dew_point_2m?: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  wind_direction_10m: number;
  surface_pressure: number;
  visibility?: number;
  cloud_cover: number;
  uv_index: number;
  precipitation: number;
  precipitation_probability?: number;
  is_day: number;
}

interface OMHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  weather_code: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
  relative_humidity_2m: number[];
  uv_index: number[];
  is_day: number[];
  visibility: number[];
}

interface OMDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  apparent_temperature_max: number[];
  apparent_temperature_min: number[];
  precipitation_probability_max: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
  wind_gusts_10m_max: number[];
  uv_index_max: number[];
  sunrise: string[];
  sunset: string[];
}

interface OMResponse {
  current: OMCurrent;
  hourly: OMHourly;
  daily: OMDaily;
  utc_offset_seconds: number;
}

interface OMAirResponse {
  current?: {
    time: string;
    european_aqi: number;
    pm2_5: number;
    pm10: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    ozone: number;
    sulphur_dioxide: number;
    dust?: number;
  };
}

export async function fetchWeather(location: GeoLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'dew_point_2m',
      'weather_code',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'surface_pressure',
      'cloud_cover',
      'uv_index',
      'precipitation',
      'precipitation_probability',
      'is_day',
    ].join(','),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'precipitation_probability',
      'precipitation',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'relative_humidity_2m',
      'uv_index',
      'is_day',
      'visibility',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'precipitation_probability_max',
      'precipitation_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'uv_index_max',
      'sunrise',
      'sunset',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
    past_days: '0',
  });

  const url = `${OPEN_METEO_BASE}/forecast?${params.toString()}`;
  const data = await safeFetchJson<OMResponse>(url);

  let airQuality: AirQuality | null = null;
  try {
    airQuality = await fetchAirQuality(location);
  } catch {
    /* air quality optional */
  }

  return normalize(data, location, airQuality);
}

async function fetchAirQuality(location: GeoLocation): Promise<AirQuality | null> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: [
      'european_aqi',
      'pm2_5',
      'pm10',
      'carbon_monoxide',
      'nitrogen_dioxide',
      'ozone',
      'sulphur_dioxide',
      'dust',
    ].join(','),
    timezone: 'auto',
  });
  const url = `${OPEN_METEO_AIR_BASE}/air-quality?${params.toString()}`;
  const data = await safeFetchJson<OMAirResponse>(url);
  if (!data.current) return null;
  return {
    index: data.current.european_aqi ?? 0,
    category: aqiCategory(data.current.european_aqi ?? 0),
    pm25: data.current.pm2_5,
    pm10: data.current.pm10,
    co: data.current.carbon_monoxide,
    no2: data.current.nitrogen_dioxide,
    o3: data.current.ozone,
    so2: data.current.sulphur_dioxide,
    dust: data.current.dust,
  };
}

export function aqiCategory(aqi: number): string {
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very Poor';
  return 'Extremely Poor';
}

function normalize(
  data: OMResponse,
  location: GeoLocation,
  airQuality: AirQuality | null
): WeatherData {
  const offsetMs = data.utc_offset_seconds * 1000;
  const current = normalizeCurrent(data.current, offsetMs);
  const hourly = normalizeHourly(data.hourly, offsetMs);
  const daily = normalizeDaily(data.daily, offsetMs);
  const alerts = deriveAlerts(current, daily, location);
  const astronomy = deriveAstronomy(data.daily, offsetMs);

  return {
    location,
    current,
    hourly,
    daily,
    alerts,
    airQuality,
    astronomy,
    fetchedAt: Date.now(),
  };
}

function normalizeCurrent(c: OMCurrent, offsetMs: number): CurrentWeather {
  const isDay = c.is_day === 1;
  const condition = conditionFromCodes(c.weather_code, isDay);
  return {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    condition,
    description: conditionMeta(condition).description,
    humidity: c.relative_humidity_2m,
    dewPoint: c.dew_point_2m ?? 0,
    windSpeed: c.wind_speed_10m,
    windGusts: c.wind_gusts_10m,
    windDirection: c.wind_direction_10m,
    pressure: c.surface_pressure,
    visibility: c.visibility ?? 10000,
    cloudCover: c.cloud_cover,
    uvIndex: c.uv_index,
    precipitation: c.precipitation,
    precipitationProbability: c.precipitation_probability ?? 0,
    isDay,
    observedAt: parseLocal(c.time, offsetMs),
  };
}

function normalizeHourly(h: OMHourly, offsetMs: number): HourForecast[] {
  const out: HourForecast[] = [];
  const now = Date.now();
  for (let i = 0; i < h.time.length; i++) {
    const t = parseLocal(h.time[i], offsetMs);
    if (t < now - 60 * 60 * 1000) continue;
    const isDay = h.is_day[i] === 1;
    const condition = conditionFromCodes(h.weather_code[i], isDay);
    out.push({
      time: t,
      temperature: h.temperature_2m[i],
      apparentTemperature: h.apparent_temperature[i],
      condition,
      precipitationProbability: h.precipitation_probability?.[i] ?? 0,
      precipitation: h.precipitation?.[i] ?? 0,
      windSpeed: h.wind_speed_10m[i],
      windGusts: h.wind_gusts_10m[i],
      windDirection: h.wind_direction_10m[i],
      humidity: h.relative_humidity_2m[i],
      uvIndex: h.uv_index[i],
      isDay,
    });
    if (out.length >= 48) break;
  }
  return out;
}

function normalizeDaily(d: OMDaily, offsetMs: number): DayForecast[] {
  const out: DayForecast[] = [];
  for (let i = 0; i < d.time.length; i++) {
    const date = parseLocal(d.time[i], offsetMs);
    const condition = conditionFromCodes(d.weather_code[i], true);
    out.push({
      date,
      condition,
      description: conditionMeta(condition).description,
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      apparentTempMax: d.apparent_temperature_max[i],
      apparentTempMin: d.apparent_temperature_min[i],
      precipitationProbability: d.precipitation_probability_max?.[i] ?? 0,
      precipitation: d.precipitation_sum[i],
      windSpeedMax: d.wind_speed_10m_max[i],
      windGustsMax: d.wind_gusts_10m_max[i],
      uvIndexMax: d.uv_index_max[i],
      sunrise: parseLocal(d.sunrise[i], offsetMs),
      sunset: parseLocal(d.sunset[i], offsetMs),
      humidity: 0,
    });
  }
  return out;
}

function deriveAlerts(
  current: CurrentWeather,
  daily: DayForecast[],
  location: GeoLocation
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const now = Date.now();
  const today = daily[0];

  if (current.uvIndex >= 8) {
    alerts.push({
      id: `uv-${location.id}`,
      title: 'High UV Exposure',
      description: `UV index is ${Math.round(current.uvIndex)}. Limit direct sun exposure and use protection.`,
      severity: current.uvIndex >= 11 ? 'extreme' : 'severe',
      startsAt: now,
      areas: location.name,
    });
  }

  if (current.windSpeed >= 60) {
    alerts.push({
      id: `wind-${location.id}`,
      title: 'High Wind Warning',
      description: `Sustained winds near ${Math.round(current.windSpeed)} km/h with gusts up to ${Math.round(
        current.windGusts
      )} km/h.`,
      severity: current.windSpeed >= 90 ? 'severe' : 'moderate',
      startsAt: now,
      areas: location.name,
    });
  }

  if (today && today.tempMax >= 37) {
    alerts.push({
      id: `heat-${location.id}`,
      title: 'Extreme Heat',
      description: `High of ${Math.round(today.tempMax)}° expected. Stay hydrated and avoid prolonged sun exposure.`,
      severity: today.tempMax >= 40 ? 'extreme' : 'severe',
      startsAt: now,
      areas: location.name,
    });
  }

  if (today && today.tempMax <= -5) {
    alerts.push({
      id: `cold-${location.id}`,
      title: 'Extreme Cold',
      description: `High of only ${Math.round(today.tempMax)}°. Dress warmly and limit time outdoors.`,
      severity: today.tempMax <= -15 ? 'extreme' : 'severe',
      startsAt: now,
      areas: location.name,
    });
  }

  if (current.visibility > 0 && current.visibility < 1000) {
    alerts.push({
      id: `vis-${location.id}`,
      title: 'Low Visibility',
      description: `Visibility is reduced to ${Math.round(current.visibility)} m. Drive with caution.`,
      severity: 'moderate',
      startsAt: now,
      areas: location.name,
    });
  }

  const rainHours = current.precipitation > 0;
  if (today && today.precipitationProbability >= 70 && rainHours) {
    alerts.push({
      id: `rain-${location.id}`,
      title: 'Heavy Rain Expected',
      description: `${today.precipitationProbability}% chance of precipitation today. Plan accordingly.`,
      severity: 'minor',
      startsAt: now,
      areas: location.name,
    });
  }

  return alerts;
}

function deriveAstronomy(daily: OMDaily, offsetMs: number): AstronomyData {
  const sunrise = parseLocal(daily.sunrise[0], offsetMs);
  const sunset = parseLocal(daily.sunset[0], offsetMs);
  const dayLength = sunset - sunrise;
  const solarNoon = sunrise + dayLength / 2;
  const moonPhase = computeMoonPhase(new Date());
  return {
    sunrise,
    sunset,
    solarNoon,
    dayLength,
    moonPhase,
    moonIllumination: moonIllumination(moonPhase),
  };
}

function parseLocal(local: string, offsetMs: number): number {
  const iso = local.includes('T') ? local : `${local}T00:00`;
  const asUtc = Date.parse(`${iso}Z`);
  return asUtc - offsetMs;
}

export function computeMoonPhase(date: Date): number {
  const ref = Date.parse('2000-01-06T18:14:00Z');
  const synodic = 29.530588853 * 86400000;
  const diff = date.getTime() - ref;
  const phase = ((diff % synodic) + synodic) % synodic;
  return phase / synodic;
}

export function moonIllumination(phase: number): number {
  return Math.round((1 - Math.cos(phase * Math.PI * 2)) / 2 * 100);
}

export function moonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

export function toWeatherError(e: unknown): { type: WeatherAlert['severity'] | 'unknown'; message: string } {
  if (e instanceof ApiError) return { type: 'unknown', message: e.message };
  return { type: 'unknown', message: 'Something went wrong while loading weather data.' };
}
