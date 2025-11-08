'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
} from 'lucide-react';
import { WeatherData } from '@/types';

interface WeatherDisplayProps {
  weather: WeatherData;
  compact?: boolean;
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  drizzle: CloudDrizzle,
  thunderstorm: CloudLightning,
  mist: CloudFog,
};

export default function WeatherDisplay({ weather, compact = false }: WeatherDisplayProps) {
  const Icon = weatherIcons[weather.condition] || Cloud;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-5 h-5 text-purple-600" />
        <span className="font-medium">{Math.round(weather.temperature)}°C</span>
        <span className="text-gray-600">{weather.description}</span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Icon className="w-16 h-16 text-purple-600" />
          <div>
            <div className="text-4xl font-bold text-gray-900">
              {Math.round(weather.temperature)}°C
            </div>
            <div className="text-sm text-gray-600 mt-1">
              体感 {Math.round(weather.feels_like)}°C
            </div>
          </div>
          <div className="text-lg text-gray-700">{weather.description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
