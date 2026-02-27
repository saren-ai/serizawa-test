import { redis } from "@/lib/redis";

const ANALYSIS_TTL_SECONDS = 86_400; // 24 hours

function analysisKey(characterKey: string): string {
  return `analysis:${characterKey}`;
}

/**
 * Fetch a cached analysis result.
 * Returns null on cache miss or Redis error (fail open — never block an analysis).
 */
export async function getCachedAnalysis(
  characterKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const cached = await redis.get<Record<string, unknown>>(
      analysisKey(characterKey)
    );
    return cached ?? null;
  } catch {
    // Redis unavailable — fail open so analysis still proceeds
    return null;
  }
}

/**
 * Store an analysis result in Redis with 24-hour TTL.
 * Errors are silently swallowed — caching failure must not break the response.
 */
export async function setCachedAnalysis(
  characterKey: string,
  analysis: Record<string, unknown>
): Promise<void> {
  try {
    await redis.set(analysisKey(characterKey), analysis, {
      ex: ANALYSIS_TTL_SECONDS,
    });
  } catch {
    // Redis unavailable — fail silently
  }
}

/**
 * Invalidate a cached analysis (e.g., after a new analysis run on the same character).
 */
export async function invalidateCachedAnalysis(
  characterKey: string
): Promise<void> {
  try {
    await redis.del(analysisKey(characterKey));
  } catch {
    // Fail silently
  }
}
