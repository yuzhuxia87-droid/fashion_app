/**
 * API Request and Response Types
 *
 * This file contains all type definitions for API routes.
 * Following 2025 best practices for type-safe API design.
 */

import {
  Outfit,
  ClothingItem,
  WeatherData,
  Season,
  ClothingCategory,
  AIAnalysisResult,
  OutfitWithDetails,
} from './index';

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Outfits API Types (/api/outfits)
// ============================================================================

/**
 * GET /api/outfits - Response type
 */
export interface OutfitsResponse {
  success: boolean;
  outfits: OutfitWithStats[];
}

/**
 * Outfit with computed statistics
 */
export interface OutfitWithStats extends Outfit {
  clothing_items?: ClothingItem[];
  wear_count: number;
  last_worn: string | null;
}

/**
 * POST /api/outfits - Request body
 */
export interface CreateOutfitRequest {
  imageUrl: string;
  items: ClothingItemInput[];
  season?: Season;
  style?: string;
  isArchived?: boolean;
}

/**
 * Input type for creating clothing items
 */
export interface ClothingItemInput {
  category: ClothingCategory;
  color: string;
  item_type: string;
  has_item?: boolean;
}

/**
 * POST /api/outfits - Response type
 */
export interface CreateOutfitResponse {
  success: boolean;
  outfit: Outfit;
}

/**
 * PATCH /api/outfits/[id] - Request body
 */
export interface UpdateOutfitRequest {
  is_favorite?: boolean;
  is_archived?: boolean;
  season?: Season;
  style?: string;
}

/**
 * DELETE /api/outfits/[id] - Response type
 */
export interface DeleteOutfitResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// Analysis API Types (/api/analyze)
// ============================================================================

/**
 * POST /api/analyze - Request body
 */
export interface AnalyzeRequest {
  imageUrl: string;
}

/**
 * POST /api/analyze - Response type
 */
export interface AnalyzeResponse {
  success: boolean;
  analysis: AIAnalysisResult;
}

// ============================================================================
// Upload API Types (/api/upload)
// ============================================================================

/**
 * POST /api/upload - Response type
 */
export interface UploadResponse {
  success: boolean;
  url: string;
  path: string;
}

// ============================================================================
// Image Generation API Types (/api/generate-image)
// ============================================================================

/**
 * POST /api/generate-image - Request body
 */
export interface GenerateImageRequest {
  description: string;
}

/**
 * POST /api/generate-image - Response type
 */
export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  revisedPrompt?: string;
}

// ============================================================================
// Recommendations API Types (/api/recommendations)
// ============================================================================

/**
 * GET /api/recommendations - Query parameters
 */
export interface RecommendationsQuery {
  excludeWornRecently?: boolean;
  matchWeather?: boolean;
  favoriteOnly?: boolean;
  count?: number;
  weather?: WeatherData;
}

/**
 * GET /api/recommendations - Response type
 */
export interface RecommendationsResponse {
  success: boolean;
  recommendations: OutfitWithDetails[];
}

// ============================================================================
// Image Search API Types (/api/search-images, /api/discover-images)
// ============================================================================

/**
 * GET /api/search-images - Query parameters
 */
export interface SearchImagesQuery {
  query: string;
  page?: number;
  per_page?: number;
}

/**
 * GET /api/search-images - Response type
 */
export interface SearchImagesResponse {
  success: boolean;
  images: SearchImage[];
  total?: number;
  totalPages?: number;
  hasMore: boolean;
}

/**
 * GET /api/discover-images - Response type
 */
export interface DiscoverImagesResponse {
  success: boolean;
  images: SearchImage[];
  hasMore: boolean;
}

/**
 * Unsplash image data for search results
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

// ============================================================================
// Weather API Types (/api/weather)
// ============================================================================

/**
 * GET /api/weather - Query parameters
 */
export interface WeatherQuery {
  latitude?: number;
  longitude?: number;
  city?: string;
}

/**
 * GET /api/weather - Response type
 */
export interface WeatherResponse {
  success: boolean;
  weather: WeatherData;
}

// ============================================================================
// Wear History API Types (/api/wear-history)
// ============================================================================

/**
 * POST /api/wear-history - Request body
 */
export interface RecordWearRequest {
  outfit_id: string;
  worn_date?: string; // ISO date string, defaults to today
}

/**
 * POST /api/wear-history - Response type
 */
export interface RecordWearResponse {
  success: boolean;
  message?: string;
}
