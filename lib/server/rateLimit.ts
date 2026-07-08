/**
 * Tiny in-memory rate limiter (per server instance). Good enough to blunt
 * brute-force / abuse on auth endpoints without external infra. Keyed by a
 * caller-supplied string (usually IP or IP+identifier).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalRef = globalThis as unknown as { __deftRateBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = globalRef.__deftRateBuckets ?? (globalRef.__deftRateBuckets = new Map());

/** True if the key has already hit `max` attempts inside the current window. */
export function tooManyAttempts(key: string, max: number, windowMs: number): boolean {
  const b = buckets.get(key);
  return Boolean(b && b.resetAt > Date.now() && b.count >= max);
}

/** Record one attempt against the key (opens a fresh window if expired). */
export function noteAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    b.count += 1;
  }
  // Opportunistic GC so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
}

/** Clear a key's counter (e.g. after a successful login). */
export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/** Client IP behind nginx (X-Forwarded-For first hop). */
export function requestIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
