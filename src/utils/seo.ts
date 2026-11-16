/**
 * Builders for `<title>` and `<meta name="description">` on pages whose head
 * copy is generated from route data rather than authored in frontmatter.
 *
 * Titles are assembled from a "ladder": an ordered list of phrasings from most
 * specific to least. The first one that fits inside `TITLE_MAX` with the brand
 * wins. That keeps a long country name from pushing the title past the point
 * where Google truncates it, without ever cutting a word in half.
 */

export const SITE_BRAND = "Give Back Guide";

/** Roughly where Google truncates a desktop title. */
export const TITLE_MAX = 60;

/** Minimum sensible description length before it stops being useful. */
export const DESCRIPTION_MIN = 120;

/** Upper bound for a description so it is not truncated in the SERP. */
export const DESCRIPTION_MAX = 155;

interface TitleOptions {
    /** Current pagination page. Page 1 never shows a number. */
    page?: number;
    /** Total pages. Deliberately not rendered: "of 49" is noise. */
    total?: number;
    /**
     * Keep the brand even when the result exceeds `TITLE_MAX`.
     *
     * Used for authored content, where the title describes a specific
     * listing or post and should not silently lose its brand. Generated hub
     * titles use the ladder instead.
     */
    alwaysBrand?: boolean;
}

/** Collapse runs of whitespace, which Notion titles sometimes carry. */
function normalise(value: string): string {
    return value.trim().replace(/\s+/g, " ");
}

/** Shorten to `max` characters without splitting the last word. */
function truncateAtWord(value: string, max: number): string {
    if (value.length <= max) return value;
    const cut = value.slice(0, max + 1);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, max)).trim();
}

/**
 * Build a page title.
 *
 * @example
 * buildTitle(["Regenerative Travel Projects in Portugal", "Regenerative Projects in Portugal"])
 * // "Regenerative Travel Projects in Portugal | Give Back Guide"
 */
export function buildTitle(
    candidates: string | string[],
    options: TitleOptions = {},
): string {
    const ladder = (Array.isArray(candidates) ? candidates : [candidates])
        .map(normalise)
        .filter(Boolean);

    if (ladder.length === 0) return SITE_BRAND;

    const pageSuffix =
        options.page && options.page > 1 ? ` — Page ${options.page}` : "";

    for (const candidate of ladder) {
        const branded = `${candidate}${pageSuffix} | ${SITE_BRAND}`;
        if (branded.length <= TITLE_MAX) return branded;
    }

    if (options.alwaysBrand) {
        return `${ladder[0]}${pageSuffix} | ${SITE_BRAND}`;
    }

    // Nothing fits with the brand. Drop it rather than truncate mid-phrase.
    const shortest = `${ladder[ladder.length - 1]}${pageSuffix}`;
    return truncateAtWord(shortest, TITLE_MAX);
}

/**
 * Order values by how often they appear, dropping blanks and duplicates.
 * Used to pick the cities and impact areas worth naming in a hub description.
 */
export function rankByFrequency(
    values: Array<string | null | undefined>,
    limit: number,
): string[] {
    const counts = new Map<string, number>();

    for (const value of values) {
        const clean = normalise(String(value ?? ""));
        if (!clean) continue;
        counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([value]) => value);
}

/** Join names as "a", "a and b", or "a, b and c". */
function listSentence(items: string[]): string {
    const clean = items.map(normalise).filter(Boolean);
    if (clean.length === 0) return "";
    if (clean.length === 1) return clean[0];
    return `${clean.slice(0, -1).join(", ")} and ${clean[clean.length - 1]}`;
}

const NUMBER_WORDS = [
    "No",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
];

function countWord(count: number): string {
    return NUMBER_WORDS[count] ?? String(count);
}

interface HubDescriptionInput {
    /** Number of listings in the hub. */
    count: number;
    /** e.g. "Portugal" or "Lisbon, Portugal". */
    place: string;
    /**
     * Distinct city names for a country hub, most common first. Leave empty
     * for locale hubs: the place already names the city.
     */
    cities?: string[];
    /** Impact area names, most common first. */
    impacts?: string[];
    /** Listing type, which changes the wording. */
    kind: "project" | "stay";
}

/**
 * Build a description for a country or locale hub.
 *
 * The copy has to be useful without being unique fiction, so it names the
 * things the page actually contains: how many listings, where they are, and
 * what kind of impact they have. Sentences are added only while the result
 * stays inside the SERP window, and the closing sentence is chosen by length
 * so even a hub with no recorded impact areas still fills the snippet.
 */
export function buildHubDescription({
    count,
    place,
    cities = [],
    impacts = [],
    kind,
}: HubDescriptionInput): string {
    const noun =
        kind === "stay"
            ? count === 1
                ? "place to stay that gives back in"
                : "places to stay that give back in"
            : count === 1
              ? "way to give back in"
              : "ways to give back in";

    let head = `${countWord(count)} ${noun} ${normalise(place)}`;

    if (cities.length > 0 && count > 1) {
        const where = cities.slice(0, 2);
        head +=
            where.length === 1
                ? `, all in ${where[0]}`
                : `, spread across ${listSentence(where)}`;
    }

    const parts = [`${head}.`];

    if (impacts.length > 0) {
        parts.push(`Impact areas include ${listSentence(impacts.slice(0, 2))}.`);
    }

    const closers =
        kind === "stay"
            ? [
                  "Hotels, homestays and lodges that fund conservation, community projects or education, chosen for their positive impact.",
                  "Eco hotels, homestays and lodges that fund conservation or community projects.",
                  "Eco hotels, homestays and lodges that give back locally.",
                  "Every stay is free to browse.",
              ]
            : [
                  "Sanctuaries, social enterprises, tours and places to eat, all chosen for their positive impact on people and the planet.",
                  "Sanctuaries, social enterprises, tours and places to eat, all with a positive impact.",
                  "Community projects, social enterprises and places to eat.",
                  "Every listing is free to browse.",
              ];

    for (const closer of closers) {
        if ([...parts, closer].join(" ").length <= DESCRIPTION_MAX) {
            parts.push(closer);
            break;
        }
    }

    return parts.join(" ");
}

/**
 * Section-aware default for pages that never pass a description.
 *
 * These are mostly static pages and account screens. The copy is deliberately
 * generic: it exists so no page ships an empty description, not to rank.
 */
export function defaultDescription(pathname: string): string {
    const section = pathname.split("/").filter(Boolean)[0] ?? "";

    switch (section) {
        case "about":
            return "How Give Back Guide finds, checks and lists travel experiences that give back to people, places and the planet.";
        case "for-businesses":
            return "List your business on Give Back Guide. Free to submit, free to verify, and seen by travellers looking for real social and environmental impact.";
        case "feedback":
            return "Tell us what is working, what is not, and what you would like to see next on Give Back Guide. Bug reports and feature ideas both welcome.";
        case "contact":
            return "Get in touch with the Give Back Guide team about listings, partnerships, corrections or anything else. We answer every message we receive.";
        case "support":
            return "Support Give Back Guide and help keep the directory free, independent and open to every traveller looking for a better way to travel.";
        case "sustainability":
            return "How Give Back Guide runs as a low-carbon, non-profit website, from our hosting and analytics choices to the way we travel and work.";
        case "submit":
            return "Submit a project, stay or experience to Give Back Guide. Free to list, free to verify, and reviewed by a person rather than an algorithm.";
        default:
            return "Discover animal sanctuaries, conservation projects, social enterprises and sustainable stays you can visit on your travels.";
    }
}
