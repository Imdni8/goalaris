/**
 * Simple in-memory rate limiter for API endpoints
 *
 * For production at scale, consider:
 * - Vercel KV (Redis)
 * - Upstash Rate Limit
 * - Database-backed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (user ID, IP, etc.)
   * @param limit - Maximum requests allowed in window
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.storage.get(identifier);

    // No entry or expired - create new
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + windowMs;
      this.storage.set(identifier, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    // Entry exists and not expired
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    // Increment count
    entry.count++;
    this.storage.set(identifier, entry);
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }

  /**
   * Remove expired entries from storage
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetAt) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Clear all rate limit data (for testing)
   */
  reset() {
    this.storage.clear();
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats() {
    return {
      totalEntries: this.storage.size,
      entries: Array.from(this.storage.entries()).map(([key, entry]) => ({
        identifier: key,
        count: entry.count,
        expiresAt: new Date(entry.resetAt).toISOString(),
      })),
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // AI endpoints - more expensive, stricter limits
  AI_GENERATION: {
    limit: 10, // requests
    windowMs: 60 * 1000, // per minute
  },

  // AI coaching - conversational, moderate limits
  AI_COACHING: {
    limit: 20, // requests
    windowMs: 60 * 1000, // per minute
  },

  // General API - lenient limits
  GENERAL: {
    limit: 100, // requests
    windowMs: 60 * 1000, // per minute
  },
} as const;

export { rateLimiter };

/**
 * Helper to get client identifier from request
 * Uses user ID if authenticated, falls back to IP
 */
export function getClientIdentifier(
  userId: string | undefined,
  request: Request
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from headers (Vercel provides these)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(resetAt: number): Response {
  const resetDate = new Date(resetAt);
  const waitSeconds = Math.ceil((resetAt - Date.now()) / 1000);

  return Response.json(
    {
      error: 'Too many requests. Please wait a moment and try again.',
      retryAfter: waitSeconds,
      resetAt: resetDate.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': waitSeconds.toString(),
        'X-RateLimit-Reset': resetDate.toISOString(),
      },
    }
  );
}
