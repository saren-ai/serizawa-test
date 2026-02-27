# Character Portrait Images

## Dimensions

**Required:** 600 × 900px (2:3 portrait ratio)  
**Format:** JPEG, quality 85%  
**Color:** sRGB

## Framing Notes

- **Face + upper body** — chin to mid-chest minimum
- **Centered horizontally** — the grade badge overlays bottom-left, so keep the subject's face center or right
- **Dark backgrounds preferred** — images render inside an ink-900 card; busy light backgrounds look wrong
- **No text or watermarks**

## Filename Convention

Files must match the character key format: `{character_name}_{media_key}.jpg`

Rules:
- All lowercase
- Spaces → underscores
- Special characters removed
- Pipe (`|`) between character and media replaced with `__` (double underscore)

| Character | Media | Filename |
|---|---|---|
| Mako Mori | Pacific Rim | `mako_mori__pacific_rim.jpg` |
| Dr. Ishirō Serizawa | Godzilla (2014) | `dr_ishiro_serizawa__godzilla_2014.jpg` |
| Mr. Miyagi | The Karate Kid (1984) | `mr_miyagi__the_karate_kid_1984.jpg` |
| Hikaru Sulu | Star Trek (TOS) | `hikaru_sulu__star_trek_tos.jpg` |
| Trini Kwan | Power Rangers (1993) | `trini_kwan__power_rangers_1993.jpg` |
| Yukio | The Wolverine (2013) | `yukio__the_wolverine_2013.jpg` |

## After Adding Images

Update the `character_image_url` column in Supabase for each character:

```sql
UPDATE characters
SET character_image_url = '/characters/mako_mori__pacific_rim.jpg'
WHERE character_key = 'mako_mori|pacific_rim';
```

Or use the bulk update script once images are in place.
