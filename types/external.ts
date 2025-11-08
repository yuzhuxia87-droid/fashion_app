/**
 * External API Types
 *
 * This file contains type definitions for external APIs and services.
 */

// ============================================================================
// Unsplash API Types
// ============================================================================

/**
 * Simplified search image for UI display
 */
export interface SearchImage {
  id: string;
  url: string;
  thumb: string;
  description: string;
  photographer: string;
  photographerUrl: string;
  downloadLocation: string;
}

/**
 * Raw Unsplash photo response
 */
export interface UnsplashPhoto {
  id: string;
  created_at: string;
  updated_at: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  downloads: number;
  likes: number;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  description: string | null;
  alt_description: string | null;
  user: UnsplashUser;
  exif?: {
    make?: string;
    model?: string;
    exposure_time?: string;
    aperture?: string;
    focal_length?: string;
    iso?: number;
  };
  location?: {
    city?: string;
    country?: string;
    position?: {
      latitude: number;
      longitude: number;
    };
  };
  tags?: Array<{
    title: string;
  }>;
}

/**
 * Unsplash user information
 */
export interface UnsplashUser {
  id: string;
  username: string;
  name: string;
  portfolio_url: string | null;
  bio: string | null;
  location: string | null;
  total_likes: number;
  total_photos: number;
  total_collections: number;
  profile_image: {
    small: string;
    medium: string;
    large: string;
  };
  links: {
    self: string;
    html: string;
    photos: string;
    likes: string;
    portfolio: string;
  };
}

/**
 * Unsplash search response
 */
export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// ============================================================================
// OpenWeather API Types
// ============================================================================

/**
 * OpenWeather API response
 */
export interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

// ============================================================================
// OpenAI API Types
// ============================================================================

/**
 * OpenAI Vision API request
 */
export interface OpenAIVisionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'system' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
      };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: {
    type: 'json_object' | 'text';
  };
}

/**
 * OpenAI Vision API response
 */
export interface OpenAIVisionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI DALL-E image generation request
 */
export interface OpenAIImageRequest {
  model: 'dall-e-2' | 'dall-e-3';
  prompt: string;
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  response_format?: 'url' | 'b64_json';
  style?: 'vivid' | 'natural';
}

/**
 * OpenAI DALL-E image generation response
 */
export interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

// ============================================================================
// Supabase Types
// ============================================================================

/**
 * Supabase storage upload options
 */
export interface SupabaseUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * Supabase storage response
 */
export interface SupabaseStorageResponse {
  data: {
    path: string;
  } | null;
  error: {
    message: string;
    statusCode?: string;
  } | null;
}

/**
 * Supabase auth user
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}
