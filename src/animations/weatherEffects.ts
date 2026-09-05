import type { WeatherCondition, DayPart } from '@/types/weather';

export interface SceneConfig {
  condition: WeatherCondition;
  isDay: boolean;
  motion: 'off' | 'reduced' | 'full';
}

export interface ScenePalette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  glow: string;
  accent: string;
  text: string;
  textMuted: string;
}

export function scenePalette(condition: WeatherCondition, isDay: boolean): ScenePalette {
  if (!isDay) {
    switch (condition) {
      case 'thunderstorm':
        return { skyTop: '#04060f', skyMid: '#0a1024', skyBottom: '#0d1430', glow: '#3a4a8a', accent: '#6d8bff', text: '#e7ecff', textMuted: '#9aa6c8' };
      case 'rain':
      case 'drizzle':
      case 'freezing-rain':
        return { skyTop: '#060a18', skyMid: '#0b1430', skyBottom: '#0e1a3a', glow: '#2d4a80', accent: '#6d8bff', text: '#e7ecff', textMuted: '#9aa6c8' };
      case 'snow':
        return { skyTop: '#0a1230', skyMid: '#162042', skyBottom: '#1c2a52', glow: '#4a6aa0', accent: '#9fc0ff', text: '#eef3ff', textMuted: '#a8b6d8' };
      case 'fog':
      case 'overcast':
      case 'cloudy':
        return { skyTop: '#0b1226', skyMid: '#141d36', skyBottom: '#1c2842', glow: '#3a4a6a', accent: '#8fa6cf', text: '#e7ecff', textMuted: '#9aa6c8' };
      default:
        return { skyTop: '#040714', skyMid: '#0a1230', skyBottom: '#101a3a', glow: '#1d2a5a', accent: '#9fc0ff', text: '#eef3ff', textMuted: '#9aa6c8' };
    }
  }

  switch (condition) {
    case 'clear':
      return { skyTop: '#0a3a78', skyMid: '#1f6fd4', skyBottom: '#7fc1f5', glow: '#ffd47a', accent: '#7fc1f5', text: '#0a1a30', textMuted: '#1f3a5a' };
    case 'partly-cloudy':
      return { skyTop: '#1552a0', skyMid: '#3a8bd8', skyBottom: '#a6d5f7', glow: '#ffd47a', accent: '#a6d5f7', text: '#0a1a30', textMuted: '#1f3a5a' };
    case 'cloudy':
      return { skyTop: '#4a6688', skyMid: '#6e8aac', skyBottom: '#a4bbd4', glow: '#cdd9e8', accent: '#a4bbd4', text: '#0a1a30', textMuted: '#1f3a5a' };
    case 'overcast':
      return { skyTop: '#3a4860', skyMid: '#5a6a82', skyBottom: '#8a9ab2', glow: '#a0aac0', accent: '#8a9ab2', text: '#0a1a30', textMuted: '#243a5a' };
    case 'fog':
      return { skyTop: '#5a6a82', skyMid: '#8a9ab2', skyBottom: '#c4ccda', glow: '#dde2ec', accent: '#c4ccda', text: '#0a1a30', textMuted: '#243a5a' };
    case 'drizzle':
    case 'rain':
    case 'freezing-rain':
      return { skyTop: '#2a3a5a', skyMid: '#46608a', skyBottom: '#6a86b0', glow: '#8aa6d0', accent: '#8aa6d0', text: '#0a1a30', textMuted: '#1f3a5a' };
    case 'snow':
      return { skyTop: '#5a7aa0', skyMid: '#8aa6c8', skyBottom: '#c8dcf0', glow: '#e8f0fa', accent: '#c8dcf0', text: '#0a1a30', textMuted: '#1f3a5a' };
    case 'thunderstorm':
      return { skyTop: '#1a1f2e', skyMid: '#2a334a', skyBottom: '#3a4660', glow: '#6a7ad0', accent: '#8aa6d0', text: '#e7ecff', textMuted: '#9aa6c8' };
    case 'hail':
      return { skyTop: '#3a4860', skyMid: '#5a6a82', skyBottom: '#8a9ab2', glow: '#c8dcf0', accent: '#a4bbd4', text: '#0a1a30', textMuted: '#1f3a5a' };
    default:
      return { skyTop: '#1552a0', skyMid: '#3a8bd8', skyBottom: '#a6d5f7', glow: '#ffd47a', accent: '#a6d5f7', text: '#0a1a30', textMuted: '#1f3a5a' };
  }
}

export function sceneEffectType(condition: WeatherCondition): 'rain' | 'snow' | 'thunder' | 'fog' | 'clouds' | 'stars' | 'clear' | 'aurora' {
  switch (condition) {
    case 'thunderstorm':
      return 'thunder';
    case 'rain':
    case 'drizzle':
    case 'freezing-rain':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'fog':
      return 'fog';
    case 'cloudy':
    case 'overcast':
      return 'clouds';
    default:
      return 'clear';
  }
}

export function dayPart(isDay: boolean): DayPart {
  return isDay ? 'day' : 'night';
}
