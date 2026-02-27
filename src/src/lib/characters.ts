/**
 * Character key normalization — PRD §14.
 *
 * Produces a stable, URL-safe, collision-resistant key from character name
 * and media title. Used as the primary lookup key and cache key throughout
 * the app. Must be called server-side before any DB lookup or Redis op.
 */

const MAX_SEGMENT_LENGTH = 100;

function normalizeSegment(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars except spaces and hyphens
    .replace(/\s+/g, "_")     // collapse whitespace to underscores
    .replace(/-+/g, "_")      // normalize hyphens to underscores
    .replace(/_+/g, "_")      // collapse multiple underscores
    .substring(0, MAX_SEGMENT_LENGTH);
}

/**
 * Returns a stable character key in the format:
 *   `{normalized_character_name}|{normalized_media_title}`
 *
 * @example
 * normalizeCharacterKey("Mr. Miyagi", "The Karate Kid (1984)")
 * // → "mr_miyagi|the_karate_kid_1984"
 *
 * normalizeCharacterKey("Psylocke", "X-Men Comics")
 * // → "psylocke|x_men_comics"
 */
export function normalizeCharacterKey(
  characterName: string,
  mediaTitle: string
): string {
  const namePart = normalizeSegment(characterName);
  const mediaPart = normalizeSegment(mediaTitle);
  return `${namePart}|${mediaPart}`;
}

/**
 * Parse a character key back into its name and media parts.
 * Used for pre-filling the analysis form from a URL slug.
 */
export function parseCharacterKey(
  key: string
): { namePart: string; mediaPart: string } | null {
  const pipeIndex = key.indexOf("|");
  if (pipeIndex === -1) return null;
  return {
    namePart: key.substring(0, pipeIndex),
    mediaPart: key.substring(pipeIndex + 1),
  };
}
