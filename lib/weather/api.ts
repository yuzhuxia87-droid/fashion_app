import { WeatherData, WeatherCondition } from '@/types';

// 気象庁API - 完全無料、APIキー不要
const JMA_FORECAST_URL = 'https://www.jma.go.jp/bosai/forecast/data/forecast';

// 主要都市の地域コード（気象庁）
const AREA_CODES: Record<string, string> = {
  '札幌': '016000',
  '仙台': '040000',
  '東京': '130000',
  '横浜': '140000',
  '名古屋': '230000',
  '大阪': '270000',
  '京都': '260000',
  '神戸': '280000',
  '広島': '340000',
  '福岡': '400000',
  '那覇': '471000',
};

// 緯度経度から最寄りの地域コードを取得（簡易版）
function getAreaCodeFromLocation(latitude: number, longitude: number): string {
  // 簡易的な距離計算で最寄りの都市を特定
  const cityLocations: Record<string, { lat: number; lon: number }> = {
    '016000': { lat: 43.064, lon: 141.347 }, // 札幌
    '040000': { lat: 38.268, lon: 140.872 }, // 仙台
    '130000': { lat: 35.689, lon: 139.692 }, // 東京
    '140000': { lat: 35.443, lon: 139.638 }, // 横浜
    '230000': { lat: 35.181, lon: 136.906 }, // 名古屋
    '270000': { lat: 34.693, lon: 135.502 }, // 大阪
    '260000': { lat: 35.021, lon: 135.756 }, // 京都
    '280000': { lat: 34.691, lon: 135.183 }, // 神戸
    '340000': { lat: 34.397, lon: 132.459 }, // 広島
    '400000': { lat: 33.590, lon: 130.402 }, // 福岡
    '471000': { lat: 26.212, lon: 127.681 }, // 那覇
  };

  let nearestCode = '130000'; // デフォルトは東京
  let minDistance = Infinity;

  for (const [code, loc] of Object.entries(cityLocations)) {
    const distance = Math.sqrt(
      Math.pow(latitude - loc.lat, 2) + Math.pow(longitude - loc.lon, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCode = code;
    }
  }

  return nearestCode;
}

export async function getWeatherByLocation(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    const areaCode = getAreaCodeFromLocation(latitude, longitude);
    return await getWeatherByAreaCode(areaCode);
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw new Error('天気情報の取得に失敗しました');
  }
}

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  try {
    const areaCode = AREA_CODES[city] || '130000'; // デフォルトは東京
    return await getWeatherByAreaCode(areaCode);
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw new Error('天気情報の取得に失敗しました');
  }
}

async function getWeatherByAreaCode(areaCode: string): Promise<WeatherData> {
  try {
    const url = `${JMA_FORECAST_URL}/${areaCode}.json`;
    const response = await fetch(url, {
      cache: 'no-store', // 常に最新の天気を取得
    });

    if (!response.ok) {
      throw new Error('JMA API request failed');
    }

    const data = await response.json();

    // 今日の天気予報を取得
    const todayForecast = data[0]?.timeSeries[0];
    const todayTemp = data[0]?.timeSeries[2];

    if (!todayForecast || !todayTemp) {
      throw new Error('Invalid forecast data');
    }

    // 天気コードと気温を取得
    const weatherCode = todayForecast.areas[0]?.weatherCodes?.[0] || '100';
    const weatherText = todayForecast.areas[0]?.weathers?.[0] || '晴れ';
    const tempMin = parseInt(todayTemp.areas[0]?.temps?.[0] || '15');
    const tempMax = parseInt(todayTemp.areas[0]?.temps?.[1] || '20');

    // 現在の気温を推定（最低気温と最高気温の平均）
    const currentTemp = Math.round((tempMin + tempMax) / 2);

    return {
      temperature: currentTemp,
      feels_like: currentTemp,
      condition: mapJMAWeatherCode(weatherCode),
      description: weatherText,
      icon: weatherCode,
    };
  } catch (error) {
    console.error('Error fetching JMA weather:', error);
    throw new Error('天気情報の取得に失敗しました');
  }
}

// 気象庁の天気コードをWeatherConditionにマッピング
function mapJMAWeatherCode(code: string): WeatherCondition {
  const codeNum = parseInt(code);

  // 100番台: 晴れ
  if (codeNum >= 100 && codeNum < 200) return 'clear';

  // 200番台: 曇り
  if (codeNum >= 200 && codeNum < 300) return 'clouds';

  // 300番台: 雨
  if (codeNum >= 300 && codeNum < 400) {
    if (codeNum >= 350) return 'rain'; // 強い雨
    return 'drizzle'; // 弱い雨
  }

  // 400番台: 雪
  if (codeNum >= 400 && codeNum < 500) return 'snow';

  // デフォルト
  return 'clouds';
}

// Utility function to map weather conditions (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapWeatherCondition(condition: string): WeatherCondition {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('晴') || lowerCondition.includes('clear')) return 'clear';
  if (lowerCondition.includes('曇') || lowerCondition.includes('cloud')) return 'clouds';
  if (lowerCondition.includes('雨') || lowerCondition.includes('rain')) return 'rain';
  if (lowerCondition.includes('雪') || lowerCondition.includes('snow')) return 'snow';
  if (lowerCondition.includes('雷') || lowerCondition.includes('thunder')) return 'thunderstorm';

  return 'clouds';
}

export function getWeatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    clear: '☀️',
    clouds: '☁️',
    rain: '🌧️',
    snow: '❄️',
    thunderstorm: '⛈️',
    drizzle: '🌦️',
    mist: '🌫️',
  };

  return icons[condition] || '☁️';
}

export function isRainy(condition: WeatherCondition): boolean {
  return ['rain', 'drizzle', 'thunderstorm'].includes(condition);
}

export function shouldWearCoat(temperature: number): boolean {
  return temperature < 15;
}

export function shouldWearLightClothing(temperature: number): boolean {
  return temperature > 25;
}

// 利用可能な都市一覧を取得
export function getAvailableCities(): string[] {
  return Object.keys(AREA_CODES);
}
