/**
 * Structured data builders.
 *
 * Each function returns a plain schema.org node. Callers pass the nodes to
 * `BaseHead` (via `MainLayout`), which serialises them once. `Breadcrumbs`
 * emits its own node because that is where the crumb data lives.
 *
 * Two rules apply throughout:
 *
 * 1. Nothing is invented. If a listing has no official website, the `url`
 *    property is omitted rather than pointed at our own page.
 * 2. Directory pages describe their subject, they do not impersonate it. A
 *    project or stay page is an `ItemPage` whose `mainEntity` is the business,
 *    so the business is never presented as the publisher of the page.
 */

import { SITE_DESCRIPTION, SITE_TITLE, SOCIAL_PROFILES } from "../consts";

export type SchemaNode = Record<string, unknown>;

/** Site-wide fallback image. */
const FALLBACK_IMAGE = "/giveback-guide-placeholder.jpg";

function absolute(pathOrUrl: string, site: URL): string {
    return new URL(pathOrUrl, site).href;
}

/** The publisher node reused by articles and listing pages. */
function publisherNode(site: URL): SchemaNode {
    return {
        "@type": "Organization",
        name: SITE_TITLE,
        url: site.href,
        logo: {
            "@type": "ImageObject",
            url: absolute("/favicon.png", site),
        },
    };
}

/**
 * Give Back Guide as an organisation.
 *
 * Google recommends placing this on the home page or a single about page,
 * not on every page of the site. The home page is the only caller.
 */
export function organisationSchema(site: URL): SchemaNode {
    return {
        "@type": "Organization",
        "@id": `${site.href}#organization`,
        name: SITE_TITLE,
        url: site.href,
        logo: {
            "@type": "ImageObject",
            url: absolute("/favicon.png", site),
        },
        description: SITE_DESCRIPTION,
        sameAs: SOCIAL_PROFILES,
    };
}

/**
 * The website itself, used by Google for the site name in results.
 *
 * No `SearchAction`: Google retired the sitelinks search box in November 2024.
 */
export function websiteSchema(site: URL): SchemaNode {
    return {
        "@type": "WebSite",
        "@id": `${site.href}#website`,
        url: site.href,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${site.href}#organization` },
    };
}

interface ArticleInput {
    site: URL;
    /** Canonical URL of the post. */
    url: string;
    headline: string;
    description: string;
    image?: string;
    published: Date;
    updated: Date;
    authors: string[];
}

export function articleSchema({
    site,
    url,
    headline,
    description,
    image,
    published,
    updated,
    authors,
}: ArticleInput): SchemaNode {
    const authorPage = absolute("/about/authors/", site);

    return {
        "@type": "Article",
        "@id": `${url}#article`,
        url,
        headline,
        description,
        image: absolute(image || FALLBACK_IMAGE, site),
        datePublished: published.toISOString(),
        dateModified: updated.toISOString(),
        author: authors.map((name) => ({
            "@type": "Person",
            name,
            url: authorPage,
        })),
        publisher: publisherNode(site),
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
        },
        isPartOf: {
            "@type": "WebSite",
            name: SITE_TITLE,
            url: site.href,
        },
    };
}

interface ItemPageInput {
    site: URL;
    /** Canonical URL of the directory page. */
    url: string;
    name: string;
    description: string;
    /** The business or place the page is about. */
    subject: SchemaNode;
}

/**
 * A directory listing page.
 *
 * `ItemPage` is schema.org's "page devoted to a single item". The subject is
 * nested under `mainEntity`, which keeps it clear that Give Back Guide
 * publishes the page and the subject does not own it.
 */
export function itemPageSchema({
    site,
    url,
    name,
    description,
    subject,
}: ItemPageInput): SchemaNode {
    return {
        "@type": "ItemPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        publisher: publisherNode(site),
        mainEntity: subject,
        breadcrumb: { "@id": `${url}#breadcrumb` },
    };
}

interface Crumb {
    label: string;
    href?: string;
}

interface BreadcrumbInput {
    site: URL;
    /** Canonical URL of the page the crumbs describe. */
    url: string;
    crumbs: Crumb[];
}

export function breadcrumbSchema({
    site,
    url,
    crumbs,
}: BreadcrumbInput): SchemaNode {
    return {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            item: crumb.href ? absolute(crumb.href, site) : url,
        })),
    };
}

interface ItemListInput {
    site: URL;
    /** Canonical URL of the index page. */
    url: string;
    name: string;
    items: Array<{ name: string; url: string }>;
    /** Zero-based offset of the first item on this page. */
    start?: number;
    /** Total items across every page. */
    total?: number;
}

export function itemListSchema({
    site,
    url,
    name,
    items,
    start = 0,
    total,
}: ItemListInput): SchemaNode {
    return {
        "@type": "ItemList",
        "@id": `${url}#itemlist`,
        url,
        name,
        numberOfItems: total ?? items.length,
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: start + index + 1,
            name: item.name,
            url: absolute(item.url, site),
        })),
    };
}

/**
 * Serialise nodes for a `<script type="application/ld+json">` tag.
 *
 * `<` is escaped so a title containing markup cannot close the script early.
 */
export function jsonLd(data: SchemaNode | SchemaNode[]): string {
    const nodes = Array.isArray(data) ? data : [data];
    return JSON.stringify({
        "@context": "https://schema.org",
        "@graph": nodes,
    }).replace(/</g, "\\u003c");
}
