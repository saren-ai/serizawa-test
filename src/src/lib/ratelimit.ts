import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

/**
 * Anonymous users: 3 new analyses per minute.
 * Cache hits do NOT count against this limit (checked before rate limit).
 */
export const anonymousLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "rl:anon",
  analytics: false,
});

/**
 * Authenticated users: 10 new analyses per minute.
 * Cache hits do NOT count against this limit (checked before rate limit).
 */
export const userLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:user",
  analytics: false,
});

/**
 * Admins are unlimited (bulk runner).
 * This function always returns success — it exists so callers
 * have a uniform interface regardless of role.
 */
export function adminLimiter() {
  return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
}
