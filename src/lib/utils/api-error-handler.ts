/**
 * Standard API error response
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * User-friendly error messages for common API failures
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Network error. Please check your connection and try again.',
  'NetworkError': 'Unable to connect. Please check your internet connection.',

  // Auth errors
  'Unauthorized': 'Your session has expired. Please log in again.',
  'Forbidden': 'You do not have permission to perform this action.',

  // Database errors
  'Database error': 'Unable to save your changes. Please try again.',
  'Constraint violation': 'This action conflicts with existing data.',

  // AI errors
  'AI generation failed': 'AI service is temporarily unavailable. Please try again.',
  'Rate limit exceeded': 'Too many requests. Please wait a moment and try again.',

  // Generic
  'Internal server error': 'Something went wrong on our end. Please try again.',
  'Not found': 'The requested resource was not found.',
};

/**
 * Convert raw error to user-friendly message
 */
export function getUserFriendlyError(error: unknown): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error instanceof Error) {
    return ERROR_MESSAGES[error.message] || error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const apiError = error as { message?: string; error?: string };
    const message = apiError.message || apiError.error;
    if (message) {
      return ERROR_MESSAGES[message] || message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle API response errors
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(getUserFriendlyError(errorMessage));
  }

  return response.json();
}

/**
 * Wrapper for fetch calls with automatic error handling
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    return await handleApiResponse<T>(response);
  } catch (error) {
    throw new Error(getUserFriendlyError(error));
  }
}

/**
 * Create standardized API error response
 */
export function createApiErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const error: ApiError = {
    message: getUserFriendlyError(message),
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  };

  return Response.json(error, { status });
}
