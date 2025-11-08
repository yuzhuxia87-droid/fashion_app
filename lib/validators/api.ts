/**
 * Runtime validation schemas using Zod
 *
 * Type assertions are NOT type-safe at runtime.
 * These Zod schemas validate data at runtime and provide true type safety.
 */

import { z } from 'zod';

// ============================================================================
// Outfits API Validators
// ============================================================================

export const OutfitWithStatsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  image_url: z.string().url(),
  season: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  is_favorite: z.boolean(),
  is_archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  wear_count: z.number().int().nonnegative(),
  last_worn: z.string().nullable(),
  clothing_items: z.array(z.any()).optional(), // Can be refined if needed
});

export const OutfitsResponseSchema = z.object({
  success: z.boolean().optional(),
  outfits: z.array(OutfitWithStatsSchema),
});

// ============================================================================
// Recommendations API Validators
// ============================================================================

export const RecommendationsResponseSchema = z.object({
  success: z.boolean().optional(),
  recommendations: z.array(OutfitWithStatsSchema),
});

// ============================================================================
// Image Search API Validators
// ============================================================================

export const SearchImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  thumb: z.string().url(),
  description: z.string(),
  photographer: z.string(),
  photographerUrl: z.string().url(),
  downloadLocation: z.string().url(),
});

export const DiscoverImagesResponseSchema = z.object({
  success: z.boolean().optional(),
  images: z.array(SearchImageSchema),
  hasMore: z.boolean().optional(),
});

// ============================================================================
// Type inference from schemas
// ============================================================================

export type OutfitWithStatsValidated = z.infer<typeof OutfitWithStatsSchema>;
export type OutfitsResponseValidated = z.infer<typeof OutfitsResponseSchema>;
export type RecommendationsResponseValidated = z.infer<typeof RecommendationsResponseSchema>;
export type DiscoverImagesResponseValidated = z.infer<typeof DiscoverImagesResponseSchema>;
