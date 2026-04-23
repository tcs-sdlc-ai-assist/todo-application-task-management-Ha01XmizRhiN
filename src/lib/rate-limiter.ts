const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 1000;
const DEFAULT_MAX_REQUESTS = 10;

function cleanup(): void {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now >= value.resetTime) {
      requestCounts.delete(key);
    }
  }
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanupInterval(): void {
  if (cleanupInterval === null) {
    cleanupInterval = setInterval(() => {
      cleanup();
      if (requestCounts.size === 0 && cleanupInterval !== null) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
    }, 60000);
    if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
      cleanupInterval.unref();
    }
  }
}

export function rateLimit(
  ip: string,
  options?: RateLimitOptions
): boolean {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  ensureCleanupInterval();

  const existing = requestCounts.get(ip);

  if (!existing || now >= existing.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count < maxRequests) {
    existing.count += 1;
    return true;
  }

  return false;
}

export function getRateLimitHeaders(
  ip: string,
  options?: RateLimitOptions
): { remaining: number; limit: number; resetTime: number } {
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const existing = requestCounts.get(ip);
  const now = Date.now();

  if (!existing || now >= existing.resetTime) {
    return {
      remaining: maxRequests,
      limit: maxRequests,
      resetTime: now + (options?.windowMs ?? DEFAULT_WINDOW_MS),
    };
  }

  return {
    remaining: Math.max(0, maxRequests - existing.count),
    limit: maxRequests,
    resetTime: existing.resetTime,
  };
}

export function resetRateLimit(ip?: string): void {
  if (ip) {
    requestCounts.delete(ip);
  } else {
    requestCounts.clear();
  }
}