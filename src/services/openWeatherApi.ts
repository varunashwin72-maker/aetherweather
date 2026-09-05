import type {
  AirQuality,
  AstronomyData,
  CurrentWeather,
  DayForecast,
  GeoLocation,
  HourForecast,
  WeatherAlert,
  WeatherData,
} from '@/types/weather';
import { ApiError, safeFetchJson } from '@/lib/api';
import { OPENWEATHER_DATA2_BASE, OPENWEATHER_GEO_BASE } from '@/lib/config';
import { conditionFromOpenWeatherId, conditionMeta } from '@/utils/weatherConditions';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;

interface OWCurrentResponse {
  weather: { id: number; description: string; icon: string }[];
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    dew_point?: number;
    uvi?: number;
    temp_min?: number;
    temp_max?: number;
  };
  wind: { speed: number; gust?: number; deg: number };
  clouds: { all: number };
  visibility: number;
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  dt: number;
  sys: { sunrise: number; sunset: number; country: string };
  name: string;
  cod: number;
}

interface OWForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: { id: number; description: string; icon: string }[];
  clouds: { all: number };
  wind: { speed: number; gust?: number; deg: number };
  pop: number;
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
  visibility?: number;
  sys: { pod: 'd' | 'n' };
  dt_txt: string;
}

interface OWForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: OWForecastItem[];
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    sunrise: number;
    sunset: number;
    timezone: number;
  };
}

interface OWAirResponse {
  list: {
    main: { aqi: number };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }[];
}

interface OWGeoResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

function buildUrl(base: string, path: string, params: Record<string, string>): string {
  const search = new URLSearchParams({ appid: API_KEY, ...params });
  return `${base}${path}?${search.toString()}`;
}

export async function owFetchWeather(location: GeoLocation): Promise<WeatherData> {
  if (!API_KEY) {
    throw new ApiError('no-key', 'OpenWeather API key is not configured.', 401);
  }

  const currentUrl = buildUrl(OPENWEATHER_DATA2_BASE, '/weather', {
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
    units: 'metric',
  });
  const forecastUrl = buildUrl(OPENWEATHER_DATA2_BASE, '/forecast', {
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
    units: 'metric',
  });

  const [currentData, forecastData] = await Promise.all([
    safeFetchJson<OWCurrentResponse>(currentUrl),
    safeFetchJson<OWForecastResponse>(forecastUrl),
  ]);

  let airQuality: AirQuality | null = null;
  try {
    airQuality = await owFetchAirQuality(location);
  } catch {
    /* air quality optional */
  }

  return owNormalize(currentData, forecastData, location, airQuality);
}

async function owFetchAirQuality(location: GeoLocation): Promise<AirQuality | null> {
  const url = buildUrl(OPENWEATHER_DATA2_BASE, '/air_pollution', {
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
  });
  const data = await safeFetchJson<OWAirResponse>(url);
  if (!data.list?.[0]) return null;
  const a = data.list[0];
  return {
    index: a.main.aqi,
    category: owAqiCategory(a.main.aqi),
    pm25: a.components.pm2_5,
    pm10: a.components.pm10,
    co: a.components.co,
    no2: a.components.no2,
    o3: a.components.o3,
    so2: a.components.so2,
  };
}

export function owAqiCategory(aqi: number): string {
  switch (aqi) {
    case 1:
      return 'Good';
    case 2:
      return 'Fair';
    case 3:
      return 'Moderate';
    case 4:
      return 'Poor';
    case 5:
      return 'Very Poor';
    default:
      return 'Unknown';
  }
}

function owNormalize(
  current: OWCurrentResponse,
  forecast: OWForecastResponse,
  location: GeoLocation,
  airQuality: AirQuality | null
): WeatherData {
  const currentWeather = normalizeCurrent(current);
  const hourly = normalizeHourly(forecast.list);
  const daily = normalizeDaily(forecast.list, forecast.city);
  const alerts = deriveAlerts(currentWeather, daily, location);
  const astronomy = deriveAstronomy(current.sys.sunrise, current.sys.sunset);

  return {
    location,
    current: currentWeather,
    hourly,
    daily,
    alerts,
    airQuality,
    astronomy,
    fetchedAt: Date.now(),
  };
}

function normalizeCurrent(c: OWCurrentResponse): CurrentWeather {
  const isDay = isDaytime(c.sys.sunrise, c.sys.sunset, c.dt);
  const condition = conditionFromOpenWeatherId(c.weather[0].id, isDay);
  const rain1h = c.rain?.['1h'] ?? 0;
  const snow1h = c.snow?.['1h'] ?? 0;
  return {
    temperature: c.main.temp,
    apparentTemperature: c.main.feels_like,
    condition,
    description: c.weather[0].description.charAt(0).toUpperCase() + c.weather[0].description.slice(1),
    humidity: c.main.humidity,
    dewPoint: c.main.dew_point ?? 0,
    windSpeed: c.wind.speed * 3.6,
    windGusts: (c.wind.gust ?? 0) * 3.6,
    windDirection: c.wind.deg,
    pressure: c.main.pressure,
    visibility: c.visibility ?? 10000,
    cloudCover: c.clouds.all,
    uvIndex: c.main.uvi ?? 0,
    precipitation: rain1h + snow1h,
    precipitationProbability: 0,
    isDay,
    observedAt: c.dt * 1000,
  };
}

function normalizeHourly(items: OWForecastItem[]): HourForecast[] {
  const out: HourForecast[] = [];
  const now = Date.now();
  for (const item of items) {
    const t = item.dt * 1000;
    if (t < now - 60 * 60 * 1000) continue;
    const isDay = item.sys.pod === 'd';
    const condition = conditionFromOpenWeatherId(item.weather[0].id, isDay);
    const rain3h = item.rain?.['3h'] ?? 0;
    const snow3h = item.snow?.['3h'] ?? 0;
    out.push({
      time: t,
      temperature: item.main.temp,
      apparentTemperature: item.main.feels_like,
      condition,
      precipitationProbability: Math.round((item.pop ?? 0) * 100),
      precipitation: rain3h + snow3h,
      windSpeed: item.wind.speed * 3.6,
      windGusts: (item.wind.gust ?? 0) * 3.6,
      windDirection: item.wind.deg,
      humidity: item.main.humidity,
      uvIndex: 0,
      isDay,
    });
    if (out.length >= 48) break;
  }
  return out;
}

function normalizeDaily(items: OWForecastItem[], city: OWForecastResponse['city']): DayForecast[] {
  const dayMap = new Map<string, OWForecastItem[]>();
  for (const item of items) {
    const dateKey = item.dt_txt.slice(0, 10);
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);
    dayMap.get(dateKey)!.push(item);
  }

  const out: DayForecast[] = [];
  const tzOffset = city.timezone * 1000;

  for (const [dateKey, dayItems] of dayMap) {
    if (out.length >= 7) break;

    let tempMax = -Infinity;
    let tempMin = Infinity;
    let apparentMax = -Infinity;
    let apparentMin = Infinity;
    let popMax = 0;
    let precipSum = 0;
    let windMax = 0;
    let gustMax = 0;
    let humiditySum = 0;
    let dominantWeatherId = dayItems[0].weather[0].id;

    for (const item of dayItems) {
      tempMax = Math.max(tempMax, item.main.temp_max);
      tempMin = Math.min(tempMin, item.main.temp_min);
      apparentMax = Math.max(apparentMax, item.main.feels_like);
      apparentMin = Math.min(apparentMin, item.main.feels_like);
      popMax = Math.max(popMax, item.pop ?? 0);
      precipSum += (item.rain?.['3h'] ?? 0) + (item.snow?.['3h'] ?? 0);
      windMax = Math.max(windMax, item.wind.speed * 3.6);
      gustMax = Math.max(gustMax, (item.wind.gust ?? 0) * 3.6);
      humiditySum += item.main.humidity;
      if (item.weather[0].id > dominantWeatherId) {
        dominantWeatherId = item.weather[0].id;
      }
    }

    const condition = conditionFromOpenWeatherId(dominantWeatherId, true);
    const date = parseDateString(dateKey, tzOffset);
    const dayLength = city.sunset - city.sunrise;

    out.push({
      date,
      condition,
      description: conditionMeta(condition).description,
      tempMax,
      tempMin,
      apparentTempMax: apparentMax,
      apparentTempMin: apparentMin,
      precipitationProbability: Math.round(popMax * 100),
      precipitation: precipSum,
      windSpeedMax: windMax,
      windGustsMax: gustMax,
      uvIndexMax: 0,
      sunrise: city.sunrise * 1000,
      sunset: city.sunset * 1000,
      humidity: Math.round(humiditySum / dayItems.length),
    });
  }

  return out;
}

function isDaytime(sunrise: number, sunset: number, dt: number): boolean {
  return dt >= sunrise && dt < sunset;
}

function parseDateString(dateKey: string, tzOffsetMs: number): number {
  const asUtc = Date.parse(`${dateKey}T00:00:00Z`);
  return asUtc - tzOffsetMs;
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

  if (today && today.precipitationProbability >= 70 && current.precipitation > 0) {
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

function deriveAstronomy(sunrise: number, sunset: number): AstronomyData {
  const sr = sunrise * 1000;
  const ss = sunset * 1000;
  const dayLength = ss - sr;
  const solarNoon = sr + dayLength / 2;
  const moonPhase = computeMoonPhase(new Date());
  return {
    sunrise: sr,
    sunset: ss,
    solarNoon,
    dayLength,
    moonPhase,
    moonIllumination: moonIllumination(moonPhase),
  };
}

function computeMoonPhase(date: Date): number {
  const ref = Date.parse('2000-01-06T18:14:00Z');
  const synodic = 29.530588853 * 86400000;
  const diff = date.getTime() - ref;
  const phase = ((diff % synodic) + synodic) % synodic;
  return phase / synodic;
}

function moonIllumination(phase: number): number {
  return Math.round(((1 - Math.cos(phase * Math.PI * 2)) / 2) * 100);
}

export async function owSearchLocations(query: string, count = 8): Promise<GeoLocation[]> {
  if (!API_KEY) return [];
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url = buildUrl(OPENWEATHER_GEO_BASE, '/direct', {
    q: encodeURIComponent(trimmed),
    limit: count.toString(),
  });
  try {
    const data = await safeFetchJson<OWGeoResult[]>(url);
    return data.map((r, i) => ({
      id: `ow-${r.lat.toFixed(4)}-${r.lon.toFixed(4)}-${i}`,
      name: r.name,
      region: r.state,
      country: r.country,
      latitude: r.lat,
      longitude: r.lon,
    }));
  } catch (e) {
    if (e instanceof ApiError && e.type === 'not-found') return [];
    throw e;
  }
}

export async function owReverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  if (!API_KEY) {
    return {
      id: `geo-${lat.toFixed(2)}-${lon.toFixed(2)}`,
      name: 'Current Location',
      latitude: lat,
      longitude: lon,
    };
  }
  const url = buildUrl(OPENWEATHER_GEO_BASE, '/reverse', {
    lat: lat.toString(),
    lon: lon.toString(),
    limit: '1',
  });
  try {
    const data = await safeFetchJson<OWGeoResult[]>(url);
    const hit = data?.[0];
    if (hit) {
      return {
        id: `ow-${hit.lat.toFixed(4)}-${hit.lon.toFixed(4)}`,
        name: hit.name,
        region: hit.state,
        country: hit.country,
        latitude: hit.lat,
        longitude: hit.lon,
      };
    }
  } catch {
    /* fall through */
  }
  return {
    id: `geo-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    name: 'Current Location',
    latitude: lat,
    longitude: lon,
  };
}
