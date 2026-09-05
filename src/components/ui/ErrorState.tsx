import type { ReactNode } from 'react';
import { AlertTriangle, CloudOff, KeyRound, MapPinOff, WifiOff, RotateCw } from 'lucide-react';
import type { WeatherError } from '@/types/weather';

interface Props {
  error?: WeatherError | null;
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function ErrorState({ error, title, message, icon, action }: Props) {
  let iconEl = icon ?? <AlertTriangle className="h-7 w-7" />;
  let heading = title ?? 'Something went wrong';
  let body = message ?? 'Please try again in a moment.';

  if (error) {
    switch (error.type) {
      case 'no-key':
        iconEl = <KeyRound className="h-7 w-7" />;
        heading = 'Weather service not configured';
        body = error.message;
        break;
      case 'network':
        iconEl = <WifiOff className="h-7 w-7" />;
        heading = 'No connection';
        body = error.message;
        break;
      case 'not-found':
        iconEl = <MapPinOff className="h-7 w-7" />;
        heading = 'Location not found';
        body = error.message;
        break;
      case 'permission':
        iconEl = <MapPinOff className="h-7 w-7" />;
        heading = 'Location access denied';
        body = error.message;
        break;
      case 'rate-limit':
        iconEl = <RotateCw className="h-7 w-7" />;
        heading = 'Too many requests';
        body = error.message;
        break;
      case 'api':
      default:
        iconEl = <CloudOff className="h-7 w-7" />;
        heading = 'Weather unavailable';
        body = error.message;
        break;
    }
  }

  return (
    <div className="glass-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white/5 text-aether-200">
        {iconEl}
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{heading}</h3>
      <p className="max-w-sm text-sm text-white/70">{body}</p>
      {action}
    </div>
  );
}
