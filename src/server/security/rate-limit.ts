import { NextResponse, type NextRequest } from "next/server";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Good enough for a single Node server. If the site runs on several instances
 * or serverless functions, each instance keeps its own counters — the per-account
 * lockout stored in MongoDB (see login route) still applies across all of them.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var rateLimitBuckets: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> = global.rateLimitBuckets ?? new Map();
if (!global.rateLimitBuckets) global.rateLimitBuckets = buckets;

let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Counts one hit for `key`. Returns a 429 response when the limit is exceeded, otherwise null.
 */
export function rateLimit(key: string, limit: number, windowMs: number): NextResponse | null {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  return null;
}
