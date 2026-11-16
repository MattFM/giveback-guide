#!/usr/bin/env node
/**
 * Internal-link check (T5.6).
 *
 * The rule: every post carries at least three internal links — one to a
 * listing, one to a sibling post and one to a hub — and no post is an orphan.
 * That is easy to state and easy to drift, so it is checked against the built
 * HTML rather than trusted.
 *
 * Run after `pnpm run build`:
 *
 *   pnpm run seo:links
 *
 * Exempt: posts with no `destinations` (news, brand updates and thematic
 * pieces) are not expected to link to a listing. They still need three
 * internal links and an inbound link.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { readFileSync as read } from "node:fs";

const DIST = "dist";
const BLOG_DIR = "src/content/blog";
const SITE = "https://giveback.guide";

const MIN_INTERNAL_LINKS = 3;

function htmlFiles(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            if (entry === "pagefind") continue;
            out.push(...htmlFiles(full));
        } else if (entry.endsWith(".html")) {
            out.push(full);
        }
    }
    return out;
}

function pathnameOf(file) {
    return `/${relative(DIST, file).replace(/index\.html$/, "")}`;
}

/** Normalise a link to a site pathname with a trailing slash. */
function normalise(href) {
    if (!href) return null;
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null;
    let url;
    try {
        url = new URL(href, SITE);
    } catch {
        return null;
    }
    if (url.origin !== SITE && url.origin !== "http://giveback.guide") {
        return null;
    }
    let pathname = decodeURI(url.pathname);
    if (!pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) {
        pathname += "/";
    }
    return pathname;
}

/**
 * Post destinations, read from source frontmatter.
 *
 * Returns slug -> list of place names (country, region and city). Posts with
 * an empty array are thematic and are not expected to link to a listing.
 */
function postDestinations() {
    const destinations = new Map();
    for (const file of readdirSync(BLOG_DIR)) {
        if (!file.endsWith(".mdx")) continue;
        const source = read(join(BLOG_DIR, file), "utf8");
        const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
        const slug = file.replace(/\.mdx$/, "");
        if (!frontmatter || !/^destinations:\s*$/m.test(frontmatter[1])) {
            destinations.set(slug, []);
            continue;
        }
        const block = frontmatter[1].split(/^destinations:\s*$/m)[1] ?? "";
        const names = [...block.matchAll(/^\s*(?:-\s*)?(?:country|region|city):\s*"?([^"\n]+)"?\s*$/gm)]
            .map((match) => match[1].trim())
            .filter(Boolean);
        destinations.set(slug, names);
    }
    return destinations;
}

/** The route slug for a place name, matching the hub pages' slugify. */
function placeSlug(name) {
    return name.toLowerCase().trim().replace(/\s+/g, "-");
}

const files = htmlFiles(DIST);

/** Pages that describe one listing, used to tell listing links from hubs. */
const listingPaths = new Set();
const hubPaths = new Set();
const articlePaths = new Set();

const linksByPage = new Map();
const inbound = new Map();

for (const file of files) {
    const pathname = pathnameOf(file);
    const html = readFileSync(file, "utf8");

    if (/<meta property="og:type" content="article"/.test(html)) {
        articlePaths.add(pathname);
    }
    if (/"@type":\s*"ItemPage"/.test(html)) {
        listingPaths.add(pathname);
    } else if (/"@type":\s*"ItemList"/.test(html)) {
        hubPaths.add(pathname);
    }

    const links = new Set();
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const target = normalise(match[1]);
        if (target) links.add(target);
    }
    linksByPage.set(pathname, links);
    for (const target of links) {
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
    }
}

const destinationsBySlug = postDestinations();
const withDestination = new Set(
    [...destinationsBySlug].filter(([, names]) => names.length > 0).map(([slug]) => slug),
);

// Every place name that has a hub page, so we can tell "no listings here yet"
// from "we forgot to link the ones that exist".
const hubSlugs = new Set();
for (const hub of hubPaths) {
    const segments = hub.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && !/^\d+$/.test(last)) hubSlugs.add(last);
}

function hasListings(names) {
    return names.some((name) => hubSlugs.has(placeSlug(name)));
}

const problems = [];
let fewest = { count: Infinity, path: "" };
let listingless = 0;
let noListingsAtDestination = 0;
let orphaned = 0;

for (const pathname of articlePaths) {
    const slug = pathname.replace(/^\/blog\//, "").replace(/\/$/, "");
    const links = [...(linksByPage.get(pathname) ?? [])].filter(
        (target) => target !== pathname,
    );
    const listingLinks = links.filter((target) => listingPaths.has(target));
    const postLinks = links.filter(
        (target) =>
            articlePaths.has(target) &&
            target !== pathname,
    );
    const hubLinks = links.filter((target) => hubPaths.has(target));

    if (links.length < MIN_INTERNAL_LINKS) {
        problems.push(
            `${pathname}: ${links.length} internal link${links.length === 1 ? "" : "s"} (needs ${MIN_INTERNAL_LINKS})`,
        );
    }
    if (links.length < fewest.count) fewest = { count: links.length, path: pathname };

    if (withDestination.has(slug) && listingLinks.length === 0) {
        const names = destinationsBySlug.get(slug) ?? [];
        if (hasListings(names)) {
            listingless += 1;
            problems.push(`${pathname}: no link to a listing`);
        } else {
            // Nowhere in the destination has a listing yet, so there is
            // nothing to link to. Reported, not failed.
            noListingsAtDestination += 1;
        }
    }
    if (postLinks.length === 0) {
        problems.push(`${pathname}: no link to a sibling post`);
    }
    if (hubLinks.length === 0) {
        problems.push(`${pathname}: no link to a hub`);
    }
    if ((inbound.get(pathname) ?? 0) === 0) {
        orphaned += 1;
        problems.push(`${pathname}: no inbound internal links`);
    }
}

console.log(
    `Link check — ${files.length} built pages, ${articlePaths.size} posts`,
);
console.log(`Posts with a destination: ${withDestination.size}`);
console.log(`Fewest internal links on a post: ${fewest.count} (${fewest.path})`);
console.log(`Posts with a destination but no listing link: ${listingless}`);
console.log(
    `Destination posts exempt because no listing exists there: ${noListingsAtDestination}`,
);
console.log(`Orphaned posts: ${orphaned}`);

if (problems.length > 0) {
    console.log(`\nProblems: ${problems.length}`);
    for (const problem of problems) console.log(`  ${problem}`);
    process.exit(1);
}

console.log("\nProblems: none");
