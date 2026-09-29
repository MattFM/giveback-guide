// Card-rendering helpers shared by searchable result cards (search.astro) and
// dataset cards (ProjectCard, StayCard, StayEmbed, ProjectEmbed, carousels).

export const CANONICAL_COUNTRIES = new Set([
  "New Zealand",
  "Canada",
  "Scotland",
  "Wales",
  "Australia",
  "United Kingdom",
  "UK",
  "England",
  "Northern Ireland",
  "USA",
  "United States",
  "Türkiye",
]);

const COUNTRY_ALIASES = [
  "Aotearoa",
  "Alba",
  "Cymru",
  "Turtle Island",
  "Kanata",
  "Turkey",
];

/**
 * Normalise a country field into a clean string array.
 * Accepts a comma-separated string or an array (Notion may return either).
 */
export function parseCountryList(
  value: string | string[] | null | undefined,
): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : String(value).split(",");
  return raw.map((c) => c.trim()).filter(Boolean);
}

/**
 * Drop "United Kingdom" / "UK" duplicates (kept as a list of distinct entries).
 */
export function excludeUkDuplicates(countries: string[]): string[] {
  return countries.filter((c) => c && c !== "United Kingdom" && c !== "UK");
}

/**
 * Filter to display-friendly country names: drop UK dupes and drop known aliases
 * (e.g. "Aotearoa"), keeping canonical names AND any first-time-seen names.
 * Mirrors the original search.astro card-rendering filter.
 */
export function canonicalCountryNames(countries: string[]): string[] {
  return excludeUkDuplicates(countries).filter(
    (c) => CANONICAL_COUNTRIES.has(c) || !COUNTRY_ALIASES.includes(c),
  );
}

/**
 * Render a locale list as e.g. "United Kingdom & Germany" or "UK, Ireland & 5 more".
 */
export function formatLocales(locales: string[]): string {
  if (!locales || locales.length === 0) return "";
  if (locales.length === 1) return locales[0];
  if (locales.length === 2) return `${locales[0]} & ${locales[1]}`;
  if (locales.length === 3) {
    return `${locales[0]}, ${locales[1]} & ${locales[2]}`;
  }
  const remaining = locales.length - 2;
  return `${locales[0]}, ${locales[1]} & ${remaining} more`;
}

/**
 * Truncate text with ellipsis. Used by embed components for previews.
 */
export function getExcerpt(
  text: string | null | undefined,
  maxLength = 120,
): string {
  if (!text) return "";
  const cleanText = text.trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength).trim() + "...";
}
