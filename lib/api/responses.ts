/**
 * Standard API response helpers for API routes
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details (only shown in development)
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  console.error('API Error:', { message, status, details });

  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
    { status }
  );
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(message: string = '認証が必要です') {
  return errorResponse(message, 401);
}

/**
 * Bad request response (400)
 */
export function badRequestResponse(message: string, details?: unknown) {
  return errorResponse(message, 400, details);
}

/**
 * Not found response (404)
 */
export function notFoundResponse(message: string = 'リソースが見つかりません') {
  return errorResponse(message, 404);
}

/**
 * Success response
 *
 * @param data - Response data object
 * @param status - HTTP status code (default: 200)
 *
 * @example
 * return successResponse({ outfits: [...] });
 * // Returns: { success: true, outfits: [...] }
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

/**
 * Type-safe error handling wrapper for API routes
 *
 * @param handler - Async handler function
 * @returns Handler result or error response
 *
 * @example
 * export async function GET() {
 *   return withErrorHandling(async () => {
 *     const data = await fetchData();
 *     return successResponse({ data });
 *   });
 * }
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error('Unhandled API error:', error);

    return errorResponse(
      'サーバーエラーが発生しました',
      500,
      error instanceof Error ? error.message : error
    );
  }
}
