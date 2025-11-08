// Database types
export interface User {
  id: string;
  email: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  image_url: string;
  is_archived: boolean;
  is_favorite: boolean;
  season?: Season;
  style?: string;
  created_at: string;
  updated_at: string;
}

export interface ClothingItem {
  id: string;
  outfit_id: string;
  category: ClothingCategory;
  color: string;
  item_type: string;
  has_item: boolean;
  created_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_id: string;
  clothing_item_id: string;
  created_at: string;
}

export interface WearHistory {
  id: string;
  outfit_id: string;
  user_id: string;
  worn_date: string;
  created_at: string;
}

// Enums
export type ClothingCategory =
  | 'top'
  | 'bottom'
  | 'outer'
  | 'dress'
  | 'shoes'
  | 'accessory';

// ItemType is now a string to support free-form descriptions (especially Japanese)
// Examples: "Tシャツ", "ブラウス", "カーディガン", "スキニーパンツ"
export type ItemType = string;

// Weather types
export interface WeatherData {
  temperature: number;
  feels_like: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
}

export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'snow'
  | 'thunderstorm'
  | 'drizzle'
  | 'mist';

// AI Analysis types
export interface AIAnalysisResult {
  items: DetectedItem[];
  season: Season;
  style: string;
}

export interface DetectedItem {
  category: ClothingCategory;
  color: string;
  item_type: string; // Free-form string from AI analysis
  confidence: number;
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

// Recommendation types
export interface RecommendationFilters {
  excludeWornRecently?: boolean;
  matchWeather?: boolean;
  favoriteOnly?: boolean;
}

export interface OutfitWithDetails extends Outfit {
  items: ClothingItem[];
  last_worn?: string;
  wear_count?: number; // Computed field from wear_history
}
