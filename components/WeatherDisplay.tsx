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
      <div className="flex items-center gap-2 text-sm md:text-base">
        <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
        <span className="font-medium">{Math.round(weather.temperature)}°C</span>
        <span className="text-muted-foreground">{weather.description}</span>
      </div>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 border-0">
      <CardContent className="p-5 md:p-6 text-center">
        <div className="flex flex-col items-center gap-3 md:gap-4">
          <Icon className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-foreground" />
          <div>
            <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">
              {Math.round(weather.temperature)}°C
            </div>
            <div className="text-sm md:text-base text-gray-600 mt-1">
              体感 {Math.round(weather.feels_like)}°C
            </div>
          </div>
          <div className="text-base md:text-lg lg:text-xl text-gray-700">{weather.description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
