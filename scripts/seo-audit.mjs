#!/usr/bin/env node
/**
 * Post-build SEO audit.
 *
 * Checks the generated HTML rather than the source, so it sees exactly what a
 * crawler sees. Run after `pnpm run build`:
 *
 *   pnpm run seo:audit
 *
 * Warns about titles that will be truncated, missing or badly sized
 * descriptions, and duplicate titles. Exit code is always 0: this is a report,
 * not a gate, because the title backlog is editorial rather than a build error.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 155;

/** Walk a directory and return every .html file inside it. */
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

const ENTITIES = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
};

function decode(value) {
    return value
        .replace(/&(amp|quot|#39|apos|lt|gt|nbsp|mdash|ndash);/g, (m) => ENTITIES[m] ?? m)
        .replace(/\s+/g, " ")
        .trim();
}

/** Route group, used to make the report's buckets readable. */
function sectionOf(pathname) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "home";
    const [first, second] = parts;

    if (first === "blog") {
        if (parts.length === 1) return "blog index";
        if (/^\d+$/.test(second)) return "blog index (paginated)";
        return "blog post";
    }
    if (first === "projects" || first === "stays") {
        if (parts.length === 1) return `${first} index`;
        if (/^\d+$/.test(second)) return `${first} index (paginated)`;
        if (parts.length === 2) return `${first} detail`;
        if (parts.length === 3) return `${first} hub (country/locale)`;
        return `${first} hub (paginated)`;
    }
    return first;
}

const files = htmlFiles(DIST);
const rows = [];

for (const file of files) {
    const html = readFileSync(file, "utf8");
    const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ?? "");
    const description = decode(
        (html.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? "",
    );
    // Noindex and meta-refresh pages are not competing in search, so their
    // missing descriptions and long titles are not problems to fix.
    const noindex =
        /<meta name="robots" content="[^"]*noindex/.test(html) ||
        /http-equiv="refresh"/.test(html);
    const pathname = `/${relative(DIST, file).replace(/index\.html$/, "")}`;
    rows.push({ pathname, section: sectionOf(pathname), title, description, noindex });
}

const skipped = rows.filter((r) => r.noindex).length;
const indexable = rows.filter((r) => !r.noindex);

const longTitles = indexable.filter((r) => r.title.length > TITLE_MAX);
const noDescription = indexable.filter((r) => !r.description);
const shortDescriptions = indexable.filter(
    (r) => r.description && r.description.length < DESCRIPTION_MIN,
);
const longDescriptions = indexable.filter((r) => r.description.length > DESCRIPTION_MAX);

const titleCounts = new Map();
for (const row of indexable) {
    titleCounts.set(row.title, (titleCounts.get(row.title) ?? 0) + 1);
}
const duplicates = [...titleCounts.entries()].filter(([, n]) => n > 1);

function bySection(items) {
    const counts = new Map();
    for (const item of items) {
        counts.set(item.section, (counts.get(item.section) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function printGroup(title, items, describe) {
    if (items.length === 0) return;
    console.log(`\n${title}: ${items.length}`);
    for (const [section, count] of bySection(items)) {
        console.log(`  ${String(count).padStart(4)}  ${section}`);
    }
    if (describe) {
        console.log("  worst:");
        for (const item of items
            .slice()
            .sort((a, b) => describe(b) - describe(a))
            .slice(0, 5)) {
            console.log(`    ${describe(item)}  ${item.pathname}`);
        }
    }
}

console.log(`SEO audit — ${rows.length} pages in ${DIST}/`);
console.log(`Checking ${indexable.length} indexable pages (${skipped} noindex or redirect pages skipped)`);
console.log(`Title limit ${TITLE_MAX}, description ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}`);

printGroup("Titles over the limit", longTitles, (r) => r.title.length);
printGroup("Missing descriptions", noDescription, (r) => -r.description.length);
printGroup("Descriptions under the minimum", shortDescriptions, (r) => -r.description.length);
printGroup("Descriptions over the maximum", longDescriptions, (r) => r.description.length);

if (duplicates.length > 0) {
    console.log(`\nDuplicate titles: ${duplicates.length} groups`);
    for (const [title, count] of duplicates.slice(0, 10)) {
        console.log(`  ${count}x  ${title}`);
    }
} else {
    console.log("\nDuplicate titles: none");
}
