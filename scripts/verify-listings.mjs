#!/usr/bin/env node
/**
 * Listing integrity guard (T11.12).
 *
 * Three things must be true of every published listing after a build, and each
 * of them has gone wrong before:
 *
 *   1. The listing has a page at its canonical URL.
 *   2. Its slug contains no space, no %20 and no stray whitespace.
 *   3. At least one hub page links to it, so no listing exists only as a URL
 *      nobody can reach.
 *
 * Rule 3 matters because the hub layer is the crawl path of last resort: if a
 * country hub stops listing an item, the item is still in the sitemap but has
 * no internal link pointing at it.
 *
 * Run after `pnpm run build`:
 *
 *   pnpm run seo:listings
 *
 * Duplicate slugs are reported but do not fail the run. Two Notion records
 * sharing a slug collapse into one page, so one listing silently disappears —
 * that is a data fix, and failing every deploy until Notion is cleaned would
 * stop unrelated work.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const ITEMS = "dist/api/items.json";
const SITE = "https://giveback.guide";

/** Every HTML file in dist, skipping the Pagefind index. */
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

/** `/projects/foo/` for dist/projects/foo/index.html. */
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
    let pathname = url.pathname;
    if (!pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(pathname)) {
        pathname += "/";
    }
    return pathname;
}

const items = JSON.parse(readFileSync(ITEMS, "utf8")).items;
const files = htmlFiles(DIST);

const pages = new Set();
const malformedPaths = [];
const hubLinks = new Set();
let hubCount = 0;

for (const file of files) {
    const pathname = pathnameOf(file);
    if (/%20|\s/.test(pathname)) malformedPaths.push(pathname);
    pages.add(pathname);

    const html = readFileSync(file, "utf8");
    if (!/"@type":"ItemList"/.test(html)) continue;
    hubCount += 1;
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const target = normalise(match[1]);
        if (target) hubLinks.add(target);
    }
}

const problems = [];
const duplicates = [];

const seen = new Map();
for (const item of items) {
    const collection = item.type === "project" ? "projects" : "stays";
    const url = `/${collection}/${item.slug}/`;

    if (/[\s%]/.test(item.slug) || item.slug !== item.slug.trim()) {
        problems.push(`${item.type} ${item.slug}: slug contains whitespace or an escape`);
    }
    if (!pages.has(url)) {
        problems.push(`${url}: published listing has no page`);
    }
    if (!hubLinks.has(url)) {
        problems.push(`${url}: no hub page links to this listing`);
    }

    const key = `${item.type}:${item.slug}`;
    const previous = seen.get(key);
    if (previous) {
        duplicates.push(`${item.type} ${item.slug}: ${previous} and ${item.title}`);
    } else {
        seen.set(key, item.title);
    }
}

console.log(
    `Listing guard — ${items.length} published listings across ${files.length} built pages`,
);
console.log(`Hub pages checked for links: ${hubCount}`);
console.log(`Listings with no page: ${problems.filter((p) => p.includes("has no page")).length}`);
console.log(`Mislabelled paths in dist: ${malformedPaths.length}`);
console.log(`Duplicate slugs (Notion data fix, not a build failure): ${duplicates.length}`);

if (duplicates.length > 0) {
    for (const duplicate of duplicates) console.log(`  ! ${duplicate}`);
}

if (problems.length + malformedPaths.length > 0) {
    console.log(`\nProblems: ${problems.length + malformedPaths.length}`);
    for (const pathname of malformedPaths) {
        console.log(`  ${pathname}: page path contains whitespace or an escape`);
    }
    for (const problem of problems) console.log(`  ${problem}`);
    process.exit(1);
}

console.log("\nProblems: none");
