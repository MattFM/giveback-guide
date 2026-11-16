/**
 * Place matching for related content.
 *
 * Every place comparison on the site goes through this module. That is
 * deliberate: the Notion reorganisation in `docs/plans/roadmap.md` replaces
 * the current country/locale multi-selects with a single Locations database
 * (primary location plus "also relevant in"), and a blog `destinations` entry
 * can name a country, a region or a city. When that lands, only the two
 * collection readers at the bottom of this file need to change; the matching
 * rules, the templates and the hub links stay as they are.
 *
 * Interim assumptions, documented so they are not mistaken for design:
 *
 * 1. A listing's places are the union of its `Country` and `Locale` values.
 *    Some Notion options hold several names in one string ("Edinburgh,
 *    Glasgow, Aberdeen"), so values are split on commas.
 * 2. Two places match when their normalised names are equal. Synonym pairs
 *    (UK / United Kingdom, USA / United States) are folded together. A parent
 *    and child do not match — Scotland does not match England — except where
 *    they share the "United Kingdom" name, which both listings and posts
 *    normally carry.
 * 3. Until the Locations hierarchy exists there is no parent lookup, so a
 *    post about Seville will not match a listing tagged only "Andalusia".
 *    That resolves itself when listings carry a location record.
 */

import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { excludeUkDuplicates, formatLocales } from "../lib/card-rendering";

export interface Destination {
    country: string;
    region?: string;
    city?: string;
}

export interface RelatedListingItem {
    kind: "project" | "stay";
    title: string;
    slug: string;
    href: string;
    image: string;
    place: string;
}

export interface RelatedListings {
    listings: RelatedListingItem[];
    /** Link back to the matched collection's country hub, when one applies. */
    hub: { href: string; label: string } | null;
}

export interface RelatedPost {
    title: string;
    href: string;
    image: string;
    published: Date;
}

/** Names that describe the same place. Keys and values are pre-normalised. */
const PLACE_SYNONYMS: Record<string, string> = {
    uk: "united kingdom",
    "great britain": "united kingdom",
    britain: "united kingdom",
    "u.k.": "united kingdom",
    usa: "united states",
    us: "united states",
    "u.s.": "united states",
    "u.s.a.": "united states",
    "united states of america": "united states",
    "czech republic": "czechia",
    turkey: "turkiye",
    holland: "netherlands",
    "north cyprus": "cyprus",
    "northern cyprus": "cyprus",
};

/**
 * Normalise a place name for comparison: trim, lower-case, drop diacritics
 * (Poznań / Poznan) and fold known synonyms.
 */
export function normalisePlace(name: string): string {
    const key = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    return PLACE_SYNONYMS[key] ?? key;
}

/** Split a Notion multi-select, or a comma-joined string, into place names. */
function splitPlaces(value: string[] | string | null | undefined): string[] {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : String(value).split(",");
    return raw.flatMap((entry) =>
        String(entry)
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
    );
}

function placeSet(names: string[]): Set<string> {
    return new Set(names.map(normalisePlace).filter(Boolean));
}

/** Every name a destination entry names, most specific first. */
function destinationLevels(destination: Destination): string[] {
    return [destination.city, destination.region, destination.country].filter(
        (value): value is string => Boolean(value),
    );
}

function destinationSet(destinations: Destination[]): Set<string> {
    return placeSet(destinations.flatMap(destinationLevels));
}

function slugify(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");
}

/** Display label: the most specific locale, otherwise the country. */
function placeLabel(countries: string[], locales: string[]): string {
    if (locales.length > 0) return formatLocales(locales);
    const named = excludeUkDuplicates(countries);
    return formatLocales(named.length > 0 ? named : countries);
}

interface ListingRow {
    kind: "project" | "stay";
    title: string;
    slug: string;
    href: string;
    image: string;
    place: string;
    countries: string[];
    places: Set<string>;
    published: number;
}

/**
 * Score a listing against a post's destinations.
 *
 * 3 for a city match, 2 for a region, 1 for a country. The index records
 * which destination matched, so a post listing several places in order (a
 * multi-country round-up) prefers the places it discusses first.
 */
function matchScore(
    destinations: Destination[],
    places: Set<string>,
): { score: number; index: number } | null {
    let best: { score: number; index: number } | null = null;

    destinations.forEach((destination, index) => {
        const candidates: Array<[string | undefined, number]> = [
            [destination.city, 3],
            [destination.region, 2],
            [destination.country, 1],
        ];
        for (const [name, score] of candidates) {
            if (!name) continue;
            if (!places.has(normalisePlace(name))) continue;
            if (!best || score > best.score) best = { score, index };
            if (score === 3) return;
        }
    });

    return best;
}

/** Projects and stays, flattened into the shape the cards render. */
async function loadListings(): Promise<ListingRow[]> {
    const [projects, stays] = await Promise.all([
        getCollection("projects"),
        getCollection("stays"),
    ]);

    return [
        ...projects.map((project: CollectionEntry<"projects">): ListingRow => {
            const props = project.data.properties;
            const countries = splitPlaces(props.pCountry);
            const locales = splitPlaces(props.pLocale);
            return {
                kind: "project",
                title: props.pTitle,
                slug: props.pSlug,
                href: `/projects/${props.pSlug}/`,
                image: props.pImageURL || "/giveback-guide-placeholder.jpg",
                place: placeLabel(countries, locales),
                countries,
                places: placeSet([...countries, ...locales]),
                published: (props.pPublished ?? new Date(0)).getTime(),
            };
        }),
        ...stays.map((stay: CollectionEntry<"stays">): ListingRow => {
            const props = stay.data.properties;
            const countries = splitPlaces(props.sCountry);
            const locales = splitPlaces(props.sLocale);
            return {
                kind: "stay",
                title: props.sTitle,
                slug: props.sSlug,
                href: `/stays/${props.sSlug}/`,
                image: props.sImageURL1 || "/giveback-guide-placeholder.jpg",
                place: placeLabel(countries, locales),
                countries,
                places: placeSet([...countries, ...locales]),
                published: (props.sPublished ?? new Date(0)).getTime(),
            };
        }),
    ];
}

/**
 * Listings that share a place with the post, plus a link to the country hub
 * of the top match in the same collection.
 *
 * City matches beat country matches, earlier destinations beat later ones,
 * and newer listings break the remaining ties. Empty destinations return an
 * empty result, and callers hide the block.
 */
export async function findRelatedListings(
    destinations: Destination[],
    limit = 3,
): Promise<RelatedListings> {
    if (destinations.length === 0) return { listings: [], hub: null };

    const rows = await loadListings();

    const matched = rows
        .map((row) => {
            const match = matchScore(destinations, row.places);
            return match ? { row, ...match } : null;
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort(
            (a, b) =>
                b.score - a.score ||
                a.index - b.index ||
                b.row.published - a.row.published,
        );

    if (matched.length === 0) return { listings: [], hub: null };

    // The hub link comes from the top match, so that collection and country
    // are guaranteed to have a page of their own.
    const top = matched[0].row;
    const country = top.countries[0];
    const hub = country
        ? {
              href:
                  top.kind === "project"
                      ? `/projects/${slugify(country)}/`
                      : `/stays/${slugify(country)}/`,
              label: country,
          }
        : null;

    return {
        listings: matched.slice(0, limit).map(({ row }) => ({
            kind: row.kind,
            title: row.title,
            slug: row.slug,
            href: row.href,
            image: row.image,
            place: row.place,
        })),
        hub,
    };
}

/**
 * Posts that share a place with the current post, then posts sharing a tag,
 * then the most recent. The current post is always excluded.
 */
export async function findRelatedPosts(
    currentSlug: string,
    destinations: Destination[],
    tags: string[],
    limit = 3,
): Promise<RelatedPost[]> {
    const posts = await getCollection("blog");
    const currentPlaces = destinationSet(destinations);
    const currentTags = new Set(tags);

    return posts
        .filter((post) => post.data.slug !== currentSlug)
        .map((post) => {
            const places = destinationSet(post.data.destinations ?? []);
            const sharedPlaces = [...places].filter((place) =>
                currentPlaces.has(place),
            ).length;
            const sharedTags = (post.data.tags ?? []).filter((tag) =>
                currentTags.has(tag),
            ).length;
            return { post, sharedPlaces, sharedTags };
        })
        .sort(
            (a, b) =>
                b.sharedPlaces - a.sharedPlaces ||
                b.sharedTags - a.sharedTags ||
                b.post.data.published.getTime() - a.post.data.published.getTime(),
        )
        .slice(0, limit)
        .map(({ post }) => ({
            title: post.data.title,
            href: `/blog/${post.data.slug}/`,
            image: post.data.coverImage || "/giveback-guide-placeholder.jpg",
            published: post.data.published,
        }));
}

/**
 * Posts about a hub's place, used by the country and locale hub pages.
 *
 * A post matches when any of its destinations names the hub's country or
 * locale. Posts that name the place most specifically rank first.
 */
export async function findPostsForPlace(
    placeNames: string[],
    limit = 3,
): Promise<RelatedPost[]> {
    const wanted = placeSet(placeNames);
    if (wanted.size === 0) return [];

    const posts = await getCollection("blog");

    return posts
        .map((post) => {
            let score = 0;
            for (const destination of post.data.destinations ?? []) {
                const levels: Array<[string | undefined, number]> = [
                    [destination.city, 3],
                    [destination.region, 2],
                    [destination.country, 1],
                ];
                for (const [name, weight] of levels) {
                    if (name && wanted.has(normalisePlace(name))) {
                        score = Math.max(score, weight);
                    }
                }
            }
            return { post, score };
        })
        .filter((row) => row.score > 0)
        .sort(
            (a, b) =>
                b.score - a.score ||
                b.post.data.published.getTime() - a.post.data.published.getTime(),
        )
        .slice(0, limit)
        .map(({ post }) => ({
            title: post.data.title,
            href: `/blog/${post.data.slug}/`,
            image: post.data.coverImage || "/giveback-guide-placeholder.jpg",
            published: post.data.published,
        }));
}
