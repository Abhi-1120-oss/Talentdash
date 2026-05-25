/** Per-instance token-bucket rate limiter. Good enough for V1; not horizontally shared. */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  capacity: number; // max tokens
  refillPerSecond: number;
}

export function rateLimit(
  key: string,
  cost: number,
  opts: RateLimitOptions = { capacity: 60, refillPerSecond: 1 },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: opts.capacity, updatedAt: now };
    buckets.set(key, b);
  }
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSecond);
  b.updatedAt = now;

  if (b.tokens >= cost) {
    b.tokens -= cost;
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const need = cost - b.tokens;
  return { allowed: false, retryAfterSeconds: Math.ceil(need / opts.refillPerSecond) };
}
