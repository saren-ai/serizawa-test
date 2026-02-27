/**
 * Maps character keys to local portrait images in /public/characters/.
 * Used as a fallback when character_image_url is not set in the DB.
 *
 * To add a new image:
 * 1. Drop the file in /public/characters/
 * 2. Add the mapping here: character_key → filename
 */

const IMAGE_MAP: Record<string, string> = {
  "mako_mori|pacific_rim":              "/characters/mako_mori__pacific_rim.png",
  "dr._ishirō_serizawa|godzilla_(2014)":"/characters/dr_serizawa__godzilla.png",
  "dr._ishiro_serizawa|godzilla_(2014)":"/characters/dr_serizawa__godzilla.png",
  "mr._miyagi|the_karate_kid_(1984)":   "/characters/mr_miyagi__karate_kid.png",
  "mr._miyagi|the_karate_kid":          "/characters/mr_miyagi__karate_kid.png",
  "hikaru_sulu|star_trek_(tos)":        "/characters/hikaru_sulu__star_trek.png",
  "hikaru_sulu|star_trek":              "/characters/hikaru_sulu__star_trek.png",
  "yukio|the_wolverine_(2013)":         "/characters/yukio_the_wolverine.png",
  "yukio|the_wolverine":                "/characters/yukio_the_wolverine.png",
  "akira|john_wick_4":                  "/characters/akira_john_wick_4.png",
  "akira|john_wick:_chapter_4":         "/characters/akira_john_wick_4.png",
  "akira|john_wick_chapter_4":          "/characters/akira_john_wick_4.png",
};

export function getCharacterImageUrl(
  characterKey: string,
  dbImageUrl?: string | null
): string | null {
  if (dbImageUrl) return dbImageUrl;
  return IMAGE_MAP[characterKey.toLowerCase()] ?? null;
}
