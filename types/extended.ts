/**
 * Extended Types for UI and Components
 *
 * This file contains extended types for UI state, computed fields,
 * and component-specific types.
 */

import { Outfit, ClothingItem, ClothingCategory } from './index';
import { OutfitWithStats } from './api';

// ============================================================================
// Extended Outfit Types
// ============================================================================

/**
 * NOTE: OutfitWithStats is now defined in types/api.ts
 * Import from '@/types/api' instead
 */

/**
 * Outfit with related clothing items
 */
export interface OutfitWithItems extends Outfit {
  clothing_items: ClothingItem[];
}

// ============================================================================
// Form Input Types
// ============================================================================

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
 * Analysis result item with UI state (checkbox)
 */
export interface AnalysisResultItem {
  category: ClothingCategory;
  color: string;
  item_type: string;
  confidence: number;
  has_item: boolean; // UI state for checkbox
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Filter tabs for collection page
 */
export type FilterTab = 'all' | 'favorites' | 'notWornRecently';

/**
 * Archive tabs for archive page
 */
export type ArchiveTab = 'retired' | 'wishlist';

/**
 * Sort options for outfit lists
 */
export type SortOption = 'newest' | 'oldest' | 'mostWorn' | 'leastWorn' | 'favorite';

/**
 * View mode for outfit display
 */
export type ViewMode = 'grid' | 'list';

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Toast notification configuration
 */
export interface ToastNotification {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Loading and Error States
// ============================================================================

/**
 * Generic loading state
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

/**
 * Generic error state
 */
export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

/**
 * Async data state wrapper
 */
export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorState;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Pagination controls
 */
export interface PaginationControls {
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
}

// ============================================================================
// Modal Types
// ============================================================================

/**
 * Generic modal state
 */
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

/**
 * Outfit detail modal state
 */
export interface OutfitModalState {
  isOpen: boolean;
  outfit: OutfitWithStats | null;
}

/**
 * Confirmation modal state
 */
export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}
