#!/usr/bin/env node
/**
 * Post-build structured data check.
 *
 * Parses the JSON-LD actually emitted into `dist/`, rather than the source,
 * so it sees what a crawler sees. Run after `pnpm run build`:
 *
 *   pnpm run seo:schema
 *
 * Hard failures exit 1: malformed JSON, missing types, absolute-URL mistakes,
 * Article or ItemPage on the wrong pages, or markup that claims a listing is
 * the publisher rather than the subject.
 *
 * This is a structural check. Google's Rich Results Test and the Schema.org
 * validator need a public URL, so those run after deploy.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const BANNED_KEYS = ["aggregateRating", "review", "priceRange", "offers"];
const ABSOLUTE_URL_KEYS = ["url", "image", "item", "logo", "contentUrl"];

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

function isIndexPage(pathname) {
    return /^\/(projects|stays|blog)(\/\d+)?\/$/.test(pathname);
}

/** Walk every object in a node, collecting keys and bad URLs. */
function inspect(node, problems, path = "root") {
    if (Array.isArray(node)) {
        node.forEach((item, index) => inspect(item, problems, `${path}[${index}]`));
        return;
    }
    if (node === null || typeof node !== "object") return;

    for (const [key, value] of Object.entries(node)) {
        if (BANNED_KEYS.includes(key)) {
            problems.push(`${path}.${key} is not allowed`);
        }
        if (
            ABSOLUTE_URL_KEYS.includes(key) &&
            typeof value === "string" &&
            !value.startsWith("http")
        ) {
            problems.push(`${path}.${key} is not absolute: ${value}`);
        }
        inspect(value, problems, `${path}.${key}`);
    }
}

const files = htmlFiles(DIST);
const problems = [];
const typeCounts = new Map();
let pagesWithSchema = 0;
let blocks = 0;
let nodes = 0;

for (const file of files) {
    const pathname = pathnameOf(file);
    const html = readFileSync(file, "utf8");
    // The page's own Open Graph type is the reliable signal: tag and
    // pagination pages share the /blog/ prefix, and tag slugs contain "&".
    const isArticlePage = /<meta property="og:type" content="article"/.test(html);
    const matches = [
        ...html.matchAll(
            /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
        ),
    ];

    if (matches.length === 0) {
        if (isArticlePage) {
            problems.push(`${pathname}: post has no Article markup`);
        }
        continue;
    }

    pagesWithSchema += 1;

    for (const match of matches) {
        blocks += 1;
        let payload;
        try {
            payload = JSON.parse(match[1]);
        } catch (error) {
            problems.push(`${pathname}: invalid JSON (${error.message})`);
            continue;
        }

        if (payload["@context"] !== "https://schema.org") {
            problems.push(`${pathname}: wrong or missing @context`);
        }

        const graph = Array.isArray(payload["@graph"])
            ? payload["@graph"]
            : [payload];

        for (const node of graph) {
            nodes += 1;
            const type = node["@type"];
            if (!type) {
                problems.push(`${pathname}: node without @type`);
                continue;
            }
            const types = Array.isArray(type) ? type : [type];
            for (const name of types) {
                typeCounts.set(name, (typeCounts.get(name) ?? 0) + 1);
            }
            inspect(node, problems, `${pathname} ${types.join("/")}`);

            if (types.includes("Organization") && pathname !== "/") {
                problems.push(
                    `${pathname}: top-level Organization outside the home page`,
                );
            }
            if (types.includes("WebSite") && pathname !== "/") {
                problems.push(`${pathname}: WebSite outside the home page`);
            }
            if (types.includes("SearchAction")) {
                problems.push(`${pathname}: SearchAction is retired`);
            }
            if (types.includes("Article") && !isArticlePage) {
                problems.push(`${pathname}: Article on a non-article page`);
            }
            if (types.includes("ItemList") && !isIndexPage(pathname)) {
                problems.push(`${pathname}: ItemList on a non-index page`);
            }
            if (types.includes("ItemPage")) {
                const subjectUrl = node.mainEntity?.url;
                if (
                    typeof subjectUrl === "string" &&
                    subjectUrl.startsWith("https://giveback.guide")
                ) {
                    problems.push(
                        `${pathname}: mainEntity.url points at our own page`,
                    );
                }
                if (!node.mainEntity) {
                    problems.push(`${pathname}: ItemPage without mainEntity`);
                }
            }
        }

        if (
            isArticlePage &&
            !graph.some((node) => node["@type"] === "Article")
        ) {
            problems.push(`${pathname}: post is missing Article markup`);
        }
    }
}

console.log(`Schema check — ${pagesWithSchema}/${files.length} pages carry JSON-LD`);
console.log(`${blocks} blocks, ${nodes} nodes`);
console.log(
    [...typeCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `  ${String(count).padStart(4)}  ${type}`)
        .join("\n"),
);

if (problems.length > 0) {
    console.log(`\nProblems: ${problems.length}`);
    for (const problem of problems) console.log(`  ${problem}`);
    process.exit(1);
}

console.log("\nProblems: none");
