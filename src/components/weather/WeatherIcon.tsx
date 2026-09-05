import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudHail,
} from 'lucide-react';
import type { WeatherCondition } from '@/types/weather';
import { weatherIconKey } from '@/utils/weatherConditions';

interface Props {
  condition: WeatherCondition;
  isDay?: boolean;
  className?: string;
  animate?: boolean;
}

export function WeatherIcon({ condition, isDay = true, className = '', animate = true }: Props) {
  const key = weatherIconKey(condition, isDay);
  const cls = `${className} ${animate ? 'transition-transform duration-500' : ''}`;
  const float = animate ? 'animate-float' : '';

  switch (key) {
    case 'sun':
      return (
        <Sun className={`${cls} ${float} text-amber-300`} strokeWidth={1.6} />
      );
    case 'moon':
      return <Moon className={`${cls} ${float} text-slate-100`} strokeWidth={1.6} />;
    case 'cloud-sun':
      return <CloudSun className={`${cls} ${float} text-amber-200`} strokeWidth={1.6} />;
    case 'cloud-moon':
      return <CloudMoon className={`${cls} ${float} text-slate-100`} strokeWidth={1.6} />;
    case 'cloud':
      return <Cloud className={`${cls} ${float} text-slate-200`} strokeWidth={1.6} />;
    case 'fog':
      return <CloudFog className={`${cls} ${float} text-slate-300`} strokeWidth={1.6} />;
    case 'drizzle':
      return <CloudDrizzle className={`${cls} ${float} text-sky-200`} strokeWidth={1.6} />;
    case 'rain':
      return <CloudRain className={`${cls} ${float} text-sky-300`} strokeWidth={1.6} />;
    case 'snow':
      return <CloudSnow className={`${cls} ${float} text-sky-100`} strokeWidth={1.6} />;
    case 'thunderstorm':
      return <CloudLightning className={`${cls} ${float} text-amber-300`} strokeWidth={1.6} />;
    case 'hail':
      return <CloudHail className={`${cls} ${float} text-sky-200`} strokeWidth={1.6} />;
    default:
      return <Cloud className={`${cls} text-slate-200`} strokeWidth={1.6} />;
  }
}
