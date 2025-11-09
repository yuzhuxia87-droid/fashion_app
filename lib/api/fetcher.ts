/**
 * Type-safe API fetcher utilities with Zod validation
 */

import { z } from 'zod';

/**
 * Custom error class for API fetch failures
 */
export class ApiFetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiFetchError';
  }
}

/**
 * Get the base API URL
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

/**
 * Type-safe API fetcher with Zod validation
 *
 * @param endpoint - API endpoint path (e.g., '/api/outfits')
 * @param schema - Zod schema for response validation
 * @param options - Fetch options
 * @returns Validated response data
 * @throws ApiFetchError if request fails or validation fails
 *
 * @example
 * const data = await fetchApi('/api/outfits', OutfitsResponseSchema);
 */
export async function fetchApi<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include', // Always include cookies
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ApiFetchError(
        `API request failed: ${response.statusText}`,
        response.status,
        undefined,
        errorText
      );
    }

    const json = await response.json();
    const result = schema.safeParse(json);

    if (!result.success) {
      console.error('API validation error:', {
        endpoint,
        errors: result.error.issues,
        data: json,
      });

      throw new ApiFetchError(
        'API response validation failed',
        undefined,
        'VALIDATION_ERROR',
        result.error.issues
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiFetchError) {
      throw error;
    }

    throw new ApiFetchError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
      undefined,
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Safe API fetcher that returns a result object instead of throwing
 * Useful for server components where you want to handle errors gracefully
 *
 * @param endpoint - API endpoint path
 * @param schema - Zod schema for response validation
 * @param options - Fetch options
 * @returns Object with data or error
 *
 * @example
 * const { data, error } = await fetchApiSafe('/api/outfits', OutfitsResponseSchema);
 * if (error) {
 *   console.error('Failed to fetch:', error);
 *   return { outfits: [] };
 * }
 * return { outfits: data.outfits };
 */
export async function fetchApiSafe<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: RequestInit = {}
): Promise<{ data: T | null; error: ApiFetchError | null }> {
  try {
    const data = await fetchApi(endpoint, schema, options);
    return { data, error: null };
  } catch (error) {
    const apiError = error instanceof ApiFetchError
      ? error
      : new ApiFetchError(
          error instanceof Error ? error.message : 'Unknown error',
          undefined,
          'UNKNOWN_ERROR',
          error
        );

    console.error('API fetch error:', {
      endpoint,
      error: apiError,
    });

    return { data: null, error: apiError };
  }
}

/**
 * Build query string from params object
 *
 * @param params - Object with query parameters
 * @returns Query string with leading '?' or empty string
 *
 * @example
 * buildQueryString({ page: 1, limit: 10 }) // '?page=1&limit=10'
 * buildQueryString({ q: undefined }) // ''
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
