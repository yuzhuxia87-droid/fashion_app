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

const ClothingItemSchema = z.object({
  id: z.string().uuid(),
  outfit_id: z.string().uuid(),
  category: z.enum(['top', 'bottom', 'outer', 'dress', 'shoes', 'accessory']),
  color: z.string(),
  item_type: z.string(),
  has_item: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

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
  items: z.array(ClothingItemSchema),
  // Accept clothing_items from Supabase but transform to items
  clothing_items: z.array(ClothingItemSchema).optional(),
}).transform((data) => {
  // Ensure items is always populated from clothing_items if needed
  const items = data.items || data.clothing_items || [];
  const { clothing_items, ...rest } = data;
  return { ...rest, items };
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
