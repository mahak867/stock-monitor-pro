/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-process deployments (local dev, single Vercel instance).
 * For multi-instance production deployments, swap the Map for a Redis-backed
 * store such as @upstash/ratelimit.
 *
 * Usage:
 *   const result = checkRateLimit(userId, 10, 60_000); // 10 req / min
 *   if (!result.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();

/**
 * Check whether a keyed caller is within their rate limit.
 *
 * @param key       Unique caller identifier (e.g. Clerk userId, IP address).
 * @param limit     Maximum number of requests allowed in the window.
 * @param windowMs  Duration of the sliding window in milliseconds.
 * @returns         `{ allowed, retryAfter }` — retryAfter is seconds until the window resets.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    // Start a new window.
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

/** Periodically prune expired entries to avoid unbounded memory growth. */
let pruneTimer: ReturnType<typeof setInterval> | null = null;
if (typeof setInterval !== 'undefined') {
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows.entries()) {
      if (now >= entry.resetAt) windows.delete(key);
    }
  }, 60_000);
  // Allow the process to exit even when the timer is active.
  if (pruneTimer && typeof pruneTimer === 'object' && 'unref' in pruneTimer) {
    (pruneTimer as NodeJS.Timeout).unref();
  }
}
