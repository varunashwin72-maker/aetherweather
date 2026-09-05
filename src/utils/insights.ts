import type { HourForecast, DayForecast, WeatherData } from '@/types/weather';
import { conditionMeta } from '@/utils/weatherConditions';

export interface Insight {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: 'info' | 'warn' | 'good';
}

export function generateInsights(data: WeatherData): Insight[] {
  const insights: Insight[] = [];
  const { current, hourly, daily } = data;
  const now = Date.now();

  // Rain timing
  const nextRain = hourly.find(
    (h) => h.time > now && h.precipitationProbability >= 50 && h.precipitation > 0
  );
  if (nextRain) {
    const minutes = Math.round((nextRain.time - now) / 60000);
    if (minutes <= 120) {
      insights.push({
        id: 'rain-soon',
        icon: 'rain',
        title: `Rain expected in ${minutes} minutes`,
        detail: `Precipitation probability rises to ${nextRain.precipitationProbability}% around ${formatHour(
          nextRain.time
        )}.`,
        tone: 'warn',
      });
    }
  }

  // Rain window
  const rainWindow = hourly.filter((h) => h.time > now && h.precipitationProbability >= 60);
  if (rainWindow.length >= 2) {
    const start = rainWindow[0];
    const end = rainWindow[rainWindow.length - 1];
    if (end.time - start.time <= 6 * 3600000) {
      insights.push({
        id: 'rain-window',
        icon: 'cloud-rain',
        title: `Rain likely between ${formatHour(start.time)} and ${formatHour(end.time)}`,
        detail: 'Carry an umbrella if heading out during this window.',
        tone: 'warn',
      });
    }
  }

  // Temperature drop overnight
  if (daily.length > 0) {
    const tonight = daily[0];
    const drop = current.temperature - tonight.tempMin;
    if (drop >= 5) {
      insights.push({
        id: 'temp-drop',
        icon: 'thermometer',
        title: `Temperatures will drop by ${Math.round(drop)}° tonight`,
        detail: `Tonight's low near ${Math.round(tonight.tempMin)}°.`,
        tone: 'info',
      });
    }
  }

  // UV window
  const highUv = hourly.filter((h) => h.time > now && h.uvIndex >= 6);
  if (highUv.length > 0) {
    const start = highUv[0];
    const end = highUv[highUv.length - 1];
    insights.push({
      id: 'uv-high',
      icon: 'sun',
      title: `UV levels are high between ${formatHour(start.time)} and ${formatHour(end.time)}`,
      detail: 'Wear sunscreen and protective clothing.',
      tone: 'warn',
    });
  }

  // Wind tomorrow morning
  if (daily.length > 1 && daily[1].windGustsMax >= 50) {
    insights.push({
      id: 'wind-tomorrow',
      icon: 'wind',
      title: 'Strong winds expected tomorrow',
      detail: `Gusts up to ${Math.round(daily[1].windGustsMax)} km/h in the morning.`,
      tone: 'warn',
    });
  }

  // Pleasant day
  const cm = conditionMeta(current.condition);
  if (
    current.temperature >= 18 &&
    current.temperature <= 26 &&
    current.precipitationProbability < 30 &&
    current.uvIndex < 8
  ) {
    insights.push({
      id: 'pleasant',
      icon: 'smile',
      title: 'Great weather to be outside',
      detail: `${cm.label} with comfortable temperatures and low rain chance.`,
      tone: 'good',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'default',
      icon: 'cloud',
      title: 'Conditions are stable',
      detail: `Currently ${cm.label.toLowerCase()} at ${Math.round(current.temperature)}°.`,
      tone: 'info',
    });
  }

  return insights.slice(0, 6);
}

function formatHour(t: number): string {
  return new Date(t).toLocaleTimeString([], { hour: 'numeric' });
}

export function minutesUntilRain(hourly: HourForecast[]): number | null {
  const now = Date.now();
  const hit = hourly.find(
    (h) => h.time > now && h.precipitationProbability >= 50 && h.precipitation > 0.1
  );
  if (!hit) return null;
  return Math.round((hit.time - now) / 60000);
}

export function precipitationTimeline(hourly: HourForecast[], maxHours = 12) {
  const now = Date.now();
  return hourly
    .filter((h) => h.time > now)
    .slice(0, maxHours)
    .map((h) => ({
      time: h.time,
      probability: h.precipitationProbability,
      amount: h.precipitation,
    }));
}

export function dayRangeSummary(day: DayForecast): string {
  return `${Math.round(day.tempMax)}° / ${Math.round(day.tempMin)}°`;
}
