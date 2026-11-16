# Technical SEO plan — Give Back Guide

**Created:** 11 November 2026
**Location:** `docs/plans/technical-seo-plan.md` (moved out of `~/.opencode/plan` on 11 Nov 2026)
**Scope:** Everything on the site that affects how Google crawls, indexes, understands and displays pages. Content strategy is a separate document.
**Owner:** Matthew (solo). All tasks are written so an AI agent can implement them under review.
**Status:** Phases 0–2 complete. Phase 3 not begun.
**Revision 3 (11 Nov 2026):** Every claim re-verified against the deployed build. See §8 for the log. Three claims were wrong and are corrected there; the malformed-URL diagnosis in §1.4.1 was also wrong and is rewritten.

---

## Handoff

Read this before touching anything. It exists so a session with no prior context
can act safely.

### Current state

| Field | Value |
|---|---|
| Phases complete | Phase 0 (12 Nov 2026), Phase 1 (12 Nov 2026), Phase 2 (16 Nov 2026) |
| Next action | Awaiting go-ahead for Phase 3 — W3, W4 (§4) |
| Blocked on | Nothing. Live event and Core Web Vitals checks need the next deploy |
| Coordination risk | The three redirects must ship with the next deploy — see below |
| Verified against | The live build, 11 November 2026 (§8); Phases 0–1 against local builds on 12 Nov; Phase 2 against a local build on 16 Nov |
| Progress log | §9 |

### Deploy ordering — get this wrong and you lose a ranking

Notion was cleaned on 11 November: three listing slugs that contained trailing
spaces have been fixed, so their URLs change on the next build. The live site
still serves the old malformed URLs because it has not been rebuilt.

- **T11.13 (the 301 redirects) must land in the same deploy as the rebuild.**
- Rebuild without it and `/stays/kirtipur-community-homestay%20/` returns 404.
  That URL has 861 impressions and 2 clicks at position 8.4.
- The rules live in `public/_redirects`, which Cloudflare Workers static assets
  applies as real 301s. Do not move them back to `astro.config.mjs`: on a static
  build Astro's `redirects` option only emits a 200 page with a meta refresh.
- After deploying, fetch all three old URLs and confirm a 301, not a 404:
  `/projects/awamaki%20/`, `/stays/kirtipur-community-homestay%20/`,
  `/projects/united%20way%20mumbai/`.

### Hard constraints

| Constraint | Why |
|---|---|
| Do not start **W6** (merging duplicate posts) without approval | Every merge needs a decision about which URL survives |
| Do not start **T11.1** (pruning locale hubs) without approval | It removes pages from the index |
| Do not redesign the location data model or URL scheme | W11 works with the routes as they exist — see the caution in W11 |
| Do not write article content | Matthew writes all articles. This plan supplies briefs and internal-link targets only |
| UK English in all user-facing strings | House style |

### How to work through it

1. Take **one phase** from §4 at a time. Do not batch phases.
2. Re-read each file named in a task before editing it. The plan was verified on
   11 November 2026; if a file has changed since, trust the file over the plan.
3. After each phase, run the checks in §5, then add a row to §9.
4. Verify against the live build where a claim is about behaviour, not just the
   source. Three of this plan's original claims were wrong because they were
   checked against source alone — see §8.

---

## 0. The finding in one paragraph

The site does not have a crawling problem — it has a **click-through problem and a metadata problem**. In the last 12 months it earned 1.16 million impressions and 9,622 clicks (0.83% CTR). Seventeen pages alone account for 565,285 impressions but only 1,689 clicks — a 0.30% CTR, less than half the site average. Those pages are already ranking (positions 6–17), so the lever is titles, descriptions and rich results, not new content.

The second finding is about architecture, and it cuts the opposite way to what I first assumed. The directory **already has** country and city hub pages — 109 country hubs and 480 locale hubs, all live and in the sitemap. They earn **40 clicks a year between them**, against 7,767 from 88 blog URLs. The architecture exists; it has never been filled in. A hub page currently ships with no meta description, a title ending in "Page 1 of 1", one sentence of body copy, no structured data and no inbound links from articles.

Underneath both: **no structured data anywhere**, no author attribution, utility pages submitted to Google in the sitemap, and almost no internal links between articles and the directory.

---

## 1. Verified baseline

All figures below were read directly from `~/Downloads/giveback.guide-Performance-on-Search-2026-11-10/Pages.csv` (1,000 rows, 12 months) and the live Umami database (31 Aug – 11 Nov 2026, 72 days). The two windows are **not comparable** — GSC is annual, Umami is 72 days.

### 1.1 Search Console, 12 months

| Metric | Value |
|---|---|
| Pages in export | 1,000 |
| Clicks | 9,622 |
| Impressions | 1,158,317 |
| Site CTR | 0.83% |
| Pages with 0 clicks | 688 |

### 1.2 Position bands

| Position | Pages | Impressions | Clicks |
|---|---|---|---|
| 1–3 | 30 | 133 | 1 |
| 4–10 | 522 | 424,817 | 6,182 |
| 11–20 | 314 | 637,909 | 3,192 |
| 21+ | 134 | 95,458 | 247 |

Two observations:

- **Positions 1–3 are effectively empty.** 30 pages generate 133 impressions between them. There is almost no top-of-page presence.
- **Positions 11–20 carry the most impressions** (638k) and convert poorly. These are page-two rankings — one push each would move a lot of traffic.

### 1.3 The CTR problem

Twelve pages have more than 10,000 impressions and under 1% CTR:

| Page | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| `/blog/brno/` | 250 | 167,604 | 0.15% | 11.7 |
| `/blog/oslo-in-winter/` | 233 | 56,341 | 0.41% | 10.65 |
| `/blog/north-cyprus-things-to-know/` | 239 | 53,400 | 0.45% | 16.93 |
| `/blog/vegan-glasgow-scotland/` | 273 | 52,888 | 0.52% | 11.71 |
| `/blog/bedford/` | 181 | 37,139 | 0.49% | 14.68 |
| `/blog/carbon-offsetting-apps-for-travel/` | 60 | 33,215 | 0.18% | 12.69 |
| `/blog/lugano-day-trip/` | 164 | 32,654 | 0.50% | 10.75 |
| `/blog/budapest-13-things-know-go/` | 48 | 16,956 | 0.28% | 6.00 |
| `/blog/bergamo/` | 30 | 15,689 | 0.19% | 13.69 |
| `/blog/2026-travel-trends-regenerative/` | 41 | 14,877 | 0.28% | 6.70 |
| `/blog/iron-men-crosby-beach-liverpool/` | 25 | 14,339 | 0.17% | 9.21 |
| `/blog/morocco-travel-guide/` | 34 | 13,678 | 0.25% | 20.32 |

*Illustrative, not a forecast:* lifting these twelve from 0.31% to 1.5% CTR — still below the site's best pages — would produce roughly 7,632 clicks instead of 1,578.

> **Correction to an earlier figure.** I previously quoted Brno as 9 clicks. The export says **250 clicks / 167,604 impressions / 0.15% / position 11.7**. The 9-click figure came from the 72-day Umami window, not GSC. Use the GSC numbers.

### 1.4 What the sitemap actually contains

`https://giveback.guide/sitemap-0.xml` holds **1,295 URLs**. Classified by matching against `/api/items.json` (496 published listings), and cross-referenced with the GSC export:

| Group | URLs in sitemap | With GSC data | Clicks | Impressions | Share of impressions |
|---|---|---|---|---|---|
| Blog | 88 | 79 | 7,767 | 990,316 | 86% |
| Listing detail pages | 489 | 476 | 1,572 | 145,049 | 12.5% |
| Country hubs | 109 | 99 | **27** | 1,932 | 0.17% |
| Locale hubs | 480 | 209 | **13** | 1,328 | 0.11% |
| Paginated indexes | 93 | 21 | 0 | 115 | 0.01% |

Three things follow from this:

- **The blog is the entire search presence.** 86% of impressions come from 88 URLs.
- **The directory's hub layer is invisible.** 589 country and locale hubs generate 40 clicks a year. **271 of the 480 locale hubs do not appear in the export at all** — they have effectively no impressions.
- **Pagination is dead weight.** 93 URLs, 115 impressions, zero clicks.

> **Reading the zeroes correctly.** The GSC export is capped at 1,000 rows, so a URL that is absent from it is not provably at zero impressions — only below the cut-off, which in practice means a handful at most. Treat "absent" as "negligible", not "mathematically zero". The click and impression totals for each group are lower bounds for the same reason.

A live example, `/projects/portugal/`, verified by fetching it:

```html
<title>Projects in Portugal - Page 1 of 1</title>
<meta name="description">          <!-- present but empty -->
<h1>Projects in Portugal</h1>
<p>A list of projects located in Portugal.</p>
```

No JSON-LD, no breadcrumbs, no link to any related blog post.

### 1.4.1 Data defects — fixed in Notion, not yet deployed

The sitemap has 1,259 directory URLs against 496 published listings. Matching the listing index (`/api/items.json`) against the sitemap exposed three listings at malformed URLs:

| Listing | Old URL | New URL | GSC (12m) |
|---|---|---|---|
| Awamaki | `/projects/awamaki%20/` | `/projects/awamaki/` | 11 impressions |
| Kirtipur Community Homestay | `/stays/kirtipur-community-homestay%20/` | `/stays/kirtipur-community-homestay/` | 861 impressions, 2 clicks |
| United Way Mumbai | `/projects/united%20way%20mumbai/` | `/projects/united-way-mumbai/` | 6 impressions |

**Root cause (corrected):** all three had a **trailing space in the `pSlug`/`sSlug` field**, not in the country field as this plan first stated. `pSlug` is built with `richTextToPlainText()`, which does not trim, and the route uses the value untrimmed.

**Status as of 11 Nov:** Notion is fixed. All 1,186 project and stay records were checked and **zero** slug values now contain stray whitespace. The live site still serves the old URLs because it has not been rebuilt and deployed since the edit.

**Consequence — this needs doing before the next deploy.** Google has indexed all three old URLs, and the Kirtipur one earns clicks. Once the rebuild lands, all three will 404 unless redirects are added first. See T11.13.

Notion is also inconsistent in a way that matters for the plan's linking work: the "United Way Mumbai" project has been retitled to a full sentence ("Help to keep the shores of Mumbai tidy of rubbish at regular clean-ups"), so listing titles are not uniform.

### 1.5 On-site behaviour, Umami, 72 days

| Metric | Value |
|---|---|
| Pageviews | 7,966 |
| Visitors | 6,526 |
| Bounce rate | 93.1% |
| Views per visit | 1.16 |
| Average visit | 20s |
| `/projects/` views | 65 |
| `/stays/` views | 43 |
| `/blog/` views | 552 |

Accessibility audit performed: **no structured data**, **no author byline**, **no related posts**, **6 of 71 posts** link to a project, **7 of 71** link to another post, **455 of 523 post images** have empty alt text.

---

## 2. Principles

1. **Fix what is wrong before adding what is new.** Half of this plan is removal and correction.
2. **Every change must be measurable.** Custom events come before content or layout changes so effects are attributable.
3. **One source of truth for metadata.** Today titles and descriptions are assembled ad hoc in each layout and page. Centralise.
4. **Do not noindex a page that is the only crawl path to content.** Paginated indexes must stay crawlable unless a country/city hub replaces them.
5. **UK English in all user-facing strings.**
6. **Small, reversible commits.** This is a static build; each task should be verifiable with `pnpm dev` and a check of the rendered HTML.

---

## 3. Workstreams

Tasks are numbered `T<workstream>.<n>`. Effort is S (under 1 hr), M (1–4 hrs), L (half a day or more).

### W1 — Indexation and sitemap hygiene

The sitemap currently excludes only `/docs/` and `/design/` (`astro.config.mjs`, line 33). Verified against the live `sitemap-0.xml`: **17 utility URLs are being submitted**, including all seven `/account/` pages, `/search/`, `/login/`, `/verify/`, `/claim/`, `/submit/`, `/report/` and four `/feedback/` pages.

| ID | Task | File | Effort |
|---|---|---|---|
| T1.1 | Extend the sitemap filter to drop `/account/`, `/search/`, `/login/`, `/verify/`, `/claim/`, `/submit/`, `/feedback/`, `/report/`, `/api/` | `astro.config.mjs` | done |
| T1.2 | Add `noindex` to `/search/` | `src/pages/search.astro` | done |
| T1.3 | Add `noindex` to `/login/`, `/verify/`, `/claim/`, `/submit/`, `/account/onboarding/` and `/account/verify/`. The other five `/account/` pages already have it | `src/pages/*` | done |
| T1.4 | Fix the `/verify/` page title, which currently reads **"Contact Us"** — a duplicate of `/contact/` | `src/pages/verify.astro` | done |
| T1.5 | Confirm `robots.txt` stays as-is; it already declares the sitemap correctly | `public/robots.txt` | done |

**Implementation notes (12 Nov 2026):** T1.1 uses prefix matching on the pathname, not `includes()`, so `/submit/` no longer sweeps up `/for-businesses/submit/`, which stays in the sitemap. `/api/` was dropped from the list: endpoints are never pages and it matched nothing. T1.3 required adding a `noindex` prop to `GenericPage.astro` for `/claim/` and `/submit/`. T1.4 also fixed `/report/`, which had the same duplicate title. T1.5 confirmed no change: Cloudflare AI Crawl Control injects its own `User-agent: *` block at the edge, so adding one to the file would create a competing group.

**Not a problem (checked and dismissed):** the footer links to `/about/animal-welfare/` and `/about/ai-policy/` both resolve — they are MDX pages at `src/pages/about/animal-welfare.mdx` and `src/pages/about/ai-policy.mdx`. My earlier scan wrongly reported them missing.

**Acceptance:** `sitemap-index.xml` contains no private or utility routes. Fetching `/search/` returns `<meta name="robots" content="noindex, nofollow">`.

---

### W2 — Titles and meta descriptions (highest expected return)

This is where the traffic is. Pages ranking 6–17 with 0.2–0.5% CTR are being ignored in the results page, and titles are the main cause.

| ID | Task | File | Effort |
|---|---|---|---|
| T2.1 | Introduce a single `buildTitle()` helper that always appends `\| Give Back Guide` and never emits a page number on page 1 | `src/utils/seo.ts` (new) | done |
| T2.2 | Rewrite titles for the 12 pages in §1.3 to lead with the search intent, not the site's internal labelling. Formula: `[Primary intent] — [specific hook] \| Give Back Guide` | 12 MDX files | done |
| T2.3 | Write meta descriptions for those same 12 pages, 140–155 characters, containing the primary query and a reason to click | 12 MDX files | done |
| T2.4 | Fix the blog index: live title is `Blog - Page 1 of 8` and there is **no meta description at all**. Drop the page count on page 1 and write a description | `src/pages/blog/[...page].astro` | done |
| T2.5 | Fix the projects index: live title is `All Projects - Page 1 of 49`, description empty | `src/pages/projects/[...page].astro` | done |
| T2.6 | Fix the stays index: live title is `All Stays - Page 1 of 7`, description empty | `src/pages/stays/[...page].astro` | done |
| T2.7 | Fix tag pages: live title is `Posts in Travel Guides - Page 1 of 6`. The description already falls back correctly, so only the page count needs removing | `src/pages/blog/[tag]/[...page].astro` | done |
| T2.8 | Add a missing-description fallback in `BaseHead` so no page ever ships an empty description. **Every one of the 16 pages I checked without an explicit description currently renders `<meta name="description" content="">` or omits it** | `src/components/layout/BaseHead.astro` | done |
| T2.9 | Audit every page for title length over 60 characters (truncation) | site-wide | done |
| T2.10 | Country hubs ship `Projects in Portugal - Page 1 of 1`, which is both unbranded and padded with a page count. Replace with a search-intent title and generate a description naming the number of listings, the cities covered and one impact area | `src/pages/projects/[country]/[...page].astro`, `src/pages/stays/[country]/[...page].astro` | done |
| T2.11 | Locale hubs ship the same pattern. Same fix, including the city name in the title | `src/pages/projects/[country]/[locale]/[...page].astro`, `src/pages/stays/[country]/[locale]/[...page].astro` | done |

**Implementation notes (16 Nov 2026).**

- `buildTitle()` is a ladder, not a truncator. Callers pass phrasings from most to least specific and the first that fits inside 60 characters wins, so no title ends mid-word. Authored content passes `alwaysBrand: true` and keeps the brand even when the result exceeds 60; that is the documented backlog, not a silent truncation.
- Country and locale hubs previously rebuilt display names from the slug (`usa` → `Usa`). They now carry the raw Notion name through `getStaticPaths` props, and the same pass aggregates cities and impact areas for the description. `pages.total` gives the true listing count for the hub rather than the page size.
- Hub descriptions are built from what the page actually contains — count, cities, impact areas — plus a closing sentence chosen by length. A one-listing locale hub still reaches 120 characters without inventing copy.
- T2.9 was re-scoped during implementation, with the owner's agreement. The remaining long titles are editorial (the listing or post name itself), and rewriting ~530 Notion records and MDX files is not a template task. The audit script plus the backlog note in §9 replace that work.
- The audit reads `dist/`, not the source, so it sees exactly what a crawler sees. It skips noindex and meta-refresh pages.

**Title rules**

- Under 60 characters including the suffix.
- Primary keyword first, brand last.
- No `Page N of M` except on pages 2+.
- No duplicated titles across the site (T1.4 is an example of a live duplicate).
- **Every page must have a non-empty description.** Hubs currently emit `<meta name="description">` with no content at all.

**Acceptance:** no two pages share a `<title>`. Every page has a non-empty description of 120+ characters. Fetching `/projects/portugal/` returns a branded title with no page count and a populated description.

---

### W3 — Structured data

The site has **zero JSON-LD**. For a directory this is the largest single missing signal, and it is also what produces rich results.

| ID | Schema type | Where | Effort |
|---|---|---|---|
| T3.1 | `Organization` + `WebSite` (with `SearchAction`) | `BaseHead.astro`, site-wide | M |
| T3.2 | `Article` on posts — headline, datePublished, dateModified, author, publisher, image, mainEntityOfPage | `BlogPostLayout.astro` | M |
| T3.3 | `BreadcrumbList` | `Breadcrumbs.astro` (component already renders visible breadcrumbs on listings) | M |
| T3.4 | `NGO` or `Organization` for project listings | `ProjectPage.astro` | M |
| T3.5 | `LodgingBusiness` for stays | `StayPage.astro` | M |
| T3.6 | `ItemList` on paginated index pages | projects/stays/blog indexes | M |
| T3.7 | Validate every type in Google's Rich Results Test and Schema.org validator | — | S |

**Implementation note:** put each builder in `src/utils/schema.ts` returning a plain object, and emit with a single `<script type="application/ld+json" set:html={JSON.stringify(obj)} />` in `BaseHead`. Do not hand-write JSON into layouts — it will drift.

**Do not mark up** ratings, reviews, prices or opening hours. There is no first-party data behind them and inventing it risks a manual action.

**Acceptance:** Rich Results Test passes with no errors for one post, one project, one stay and the homepage. No `Article` markup on non-article pages.

---

### W4 — Identity and credibility (E-E-A-T)

| ID | Task | File | Effort |
|---|---|---|---|
| T4.1 | Add `author` to the blog schema (default to a single name, per-post override possible) | `src/content.config.ts` | S |
| T4.2 | Render a byline on posts: name, short credential, link to an author page | `BlogPostLayout.astro` | M |
| T4.3 | Create `/about/author/` (or `/about/matthew/`) with a real bio, photo and links | new page | M |
| T4.4 | Add `lastUpdated` visibly (already computed but only shown when it differs — confirm it always renders when a genuine update occurred) | `BlogPostLayout.astro` | S |
| T4.5 | Add a visible "How we verify listings" note linking to `/about/verification/` from project pages | `ProjectPage.astro` | S |

**Why:** you are the author of all 71 posts, which is a genuine advantage over anonymous travel content. Right now the site never says so. This also feeds T3.2 — `Article` without an `author` is a weak signal.

**Acceptance:** every post shows a named author linked to a real page; the author page appears in the sitemap.

---

### W5 — Internal linking

Currently 6 posts link to a project and 7 to another post. With 441 projects, 56 stays and 167 café/bar/restaurant listings, the archive is effectively disconnected from the directory.

| ID | Task | File | Effort |
|---|---|---|---|
| T5.1 | Add a `relatedPosts` block to post templates — same primary tag, then most recent, max 3 | `BlogPostLayout.astro` | M |
| T5.2 | Add a `relatedProjects` block to post templates, matched by the post's destination | `BlogPostLayout.astro` | L |
| T5.3 | Add a `destination` frontmatter field (`country` + optional `locale`) to the blog schema so T5.2 can match reliably instead of guessing from tags | `src/content.config.ts` | M |
| T5.4 | Backfill `destination` across all 71 posts | 71 MDX files | L |
| T5.5 | Add contextual links inside existing high-impression posts to their matching listings (the 12 pages in §1.3 first) | 12 MDX files | M |
| T5.6 | Ensure every post has at least 3 outbound internal links: 1 listing, 1 sibling post, 1 hub | editorial rule | — |
| T5.7 | Add `ListingEmbed` to posts where a full card is more useful than a text link (component already exists and is registered globally in `src/mdx-components.ts`) | 12 MDX files | M |

**Note:** `ProjectPage` and `StayPage` already have a related-listings block. The gap is posts → listings and posts → posts, not listings → listings.

**Acceptance:** a spot check of five posts shows at least three internal links each, and at least one points at a listing. No post is an orphan.

---

### W6 — Duplicate and near-duplicate content

| ID | Task | Effort |
|---|---|---|
| T6.1 | Merge `/blog/north-cyprus/` and `/blog/north-cyprus-things-to-know/` | M |
| T6.2 | Merge the three Budapest posts | M |
| T6.3 | Merge the two Oslo posts (or differentiate: one "winter", one "vegan" — verify they do not target the same queries) | M |
| T6.4 | Merge the three Morocco posts | M |
| T6.5 | Merge the two Jungfrau posts | M |
| T6.6 | Add 301 redirects for every merged URL in `astro.config.mjs` (only one redirect exists today) | S |
| T6.7 | Split the tag taxonomy: 4 tags hold 71 posts, with 48 under "Travel Guides". Add destination/region tags so tag pages can rank | M |

**Before merging, check with GSC:** if both versions of a duplicate pair have meaningful impressions, keep the stronger URL and redirect the weaker one. Do not delete a page that still earns clicks.

**Acceptance:** no two published posts target the same primary query. Every retired URL 301s to its replacement.

---

### W7 — Redirects and error handling

| ID | Task | File | Effort |
|---|---|---|---|
| T7.1 | Fix the 404 page: "Back to Homepage" currently points at `href="#"`. Point it at `/` and add links to `/blog/`, `/projects/`, `/stays/` and `/search/` | `src/pages/404.astro` | done |
| T7.2 | Add a description to the 404 page | `src/pages/404.astro` | S |
| T7.3 | Add redirects for legacy paths appearing in analytics: `/home-new/`, `/why`, `/project/…` | `astro.config.mjs` | S |
| T7.4 | Add a redirect rule for the singular `/project/` and `/stay/` prefixes if any external links use them | `astro.config.mjs` | S |
| T7.5 | ~~Confirm Cloudflare returns a real 404 status~~ — **verified: unknown paths return HTTP 404**, not a soft 200. No action needed | — | done |

**Acceptance:** no internal link points to `#`. Unknown paths return HTTP 404 and a page with onward navigation.

---

### W8 — Social and sharing metadata

| ID | Task | File | Effort |
|---|---|---|---|
| T8.1 | Make `og:type` configurable — `article` for posts, `website` elsewhere | `BaseHead.astro` | done |
| T8.2 | Change Twitter tags from `property=` to `name=` (all five are wrong today) | `BaseHead.astro` | done |
| T8.3 | Add `og:site_name` and `og:locale` (`en_GB`) | `BaseHead.astro` | done |
| T8.4 | Add `article:published_time` and `article:modified_time` on posts | `BaseHead.astro` | S |
| T8.5 | Ensure the fallback image is at least 1200×630 (current placeholder is used on many pages) | `public/` | S |
| T8.6 | Add `twitter:site` if an account exists | `BaseHead.astro` | S |

**Acceptance:** a post shares with `og:type=article`; `.astro` output contains `name="twitter:card"`.

---

### W9 — Images and accessibility-adjacent SEO

| ID | Task | File | Effort |
|---|---|---|---|
| T9.1 | `ProjectCard.astro` passes `alt=""`, and the rendered output drops the attribute entirely — 9 of 10 images on `/projects/` have no `alt` at all. Use the project title | `ProjectCard.astro` | done |
| T9.2 | **455 of 523 images in blog posts have empty alt text** (`![](...)`) — 87% of all content images. Start with the 12 pages in §1.3, then work backwards. This is an editorial backlog, not a code fix | 71 MDX files | L |
| T9.3 | Add a fallback so an image with an empty alt is attributable rather than absent: pass the post title as alt when the source alt is blank | `remark-responsive-images.mjs` | S |
| T9.4 | Ensure post cover images are passed as `og:image` at full resolution (currently a Cloudinary URL, verify dimensions) | `BlogPostLayout.astro` | S |
| T9.5 | Confirm hero images on listing pages keep `fetchpriority="high"` and cards keep `loading="lazy"` — verified true on the live build | `ProjectPage.astro`, `ResponsiveImage.astro` | done |

---

### W10 — Measurement

Nothing on this list can be evaluated until events exist. **This is Phase 1.**

| Event | Fires when | Properties |
|---|---|---|
| `project_click` | A project card, project embed or search result is clicked | `slug`, `source_page` |
| `stay_click` | A stay card, stay embed or search result is clicked | `slug`, `source_page` |
| `outbound_click` | Any outbound link on a listing page is clicked | `link_type` (`website`, `map`, `social`, `booking`), `slug` |
| `newsletter_signup` | Newsletter form submits successfully **and** the address is new | `source` (`placement:section`, e.g. `footer:blog`) |
| `member_signup` | Onboarding completes | `method` |
| `search_performed` | A new search query runs, including zero-result searches | `query`, `results` |

Card and embed clicks are tracked declaratively via `data-umami-event-*`
attributes, so they need no JavaScript. The other three are fired explicitly
through `src/lib/analytics.ts`.

| ID | Task | File | Effort |
|---|---|---|---|
| T10.1 | Add `data-umami-event` attributes to listing cards and links | `ProjectCard.astro`, `StayCard.astro`, `ListingEmbed.astro`, `ActionBar.astro`, `GetInvolvedBox.astro`, `search.astro`, `ProjectPage.astro`, `StayPage.astro` | done |
| T10.2 | Fire `newsletter_signup` from the form's success branch, with a `source` of `placement:section`. The form has one instance today (the footer band), so the label must carry the placement to stay meaningful once it is duplicated | `NewsletterForm.astro`, `NewsletterSection.astro` | done |
| T10.3 | Add `data-domains="giveback.guide"` to the Umami script so preview deploys, localhost and the retired `heretotravel.com` domain stop polluting the data | `src/components/utility/Analytics.astro` | done |
| T10.4 | Bot filtering. There is **no dashboard setting**: Umami filters by user agent server-side with `isbot` and it is already on (`DISABLE_BOT_CHECK=1` turns it *off*). The Singapore block is spoofed user agents that pass that check, so it has to be blocked upstream at the ingest hostname | Cloudflare WAF | done (manual) |
| T10.5 | Enable performance tracking: `data-performance="true"` on the script tag. The attribute was simply missing, which is why there were 0 Core Web Vitals measurements | `Analytics.astro` | done |
| T10.6 | Fire `member_signup` when onboarding completes, not when a magic link is verified | `src/pages/account/onboarding.astro` | done |
| T10.7 | Fire `search_performed` from `performSearch()`, only when the query actually changed, so filter tweaks do not inflate the count | `src/pages/search.astro` | done |

**Acceptance:** clicking a project card from a blog post produces a `project_click` with `source_page=/blog/<slug>/`. Clicking a booking button produces `outbound_click` with `link_type=booking`. Check both with `get_events` / `get_event_properties` after the deploy. Umami's country report stops showing a Singapore block within a week of the WAF rule, and `get_performance` starts returning measurements.

---

### W11 — The hub layer: fill it in or prune it

The country and locale hub routes already exist:

```
src/pages/projects/[country]/[...page].astro
src/pages/projects/[country]/[locale]/[...page].astro
src/pages/stays/[country]/[...page].astro
src/pages/stays/[country]/[locale]/[...page].astro
```

That is 109 country hubs and 480 locale hubs in the sitemap, earning 27 and 13 clicks respectively over twelve months. The problem is not the URL scheme. It is that each hub is an empty shell: a generated title, an empty description, one sentence of copy and a paginated grid of nine cards.

The 480 locale hubs are the weakest surface on the site. **271 do not appear in the GSC export at all**, and the 209 that do average 6 impressions each. Several duplicate their parent country hub exactly (`/projects/aruba/aruba/`, `/projects/singapore/singapore/`, `/stays/hong-kong/hong-kong/`).

| ID | Task | File | Effort |
|---|---|---|---|
| T11.1 | Decide the survival rule for locale hubs. Recommendation: keep a locale hub only if it has 3+ published listings **and** either GSC impressions or a matching blog post; otherwise drop it from the sitemap and `noindex` it | decision | S |
| T11.2 | Collapse locale hubs where the city equals the country (`aruba/aruba`, `singapore/singapore`, `hong-kong/hong-kong`) into the country hub with a 301 | route code | S |
| T11.3 | Add a real intro paragraph per country hub — 80–120 words covering what kinds of projects exist there, which regions, and one concrete example. This is the single highest-value content task on the directory | editorial + route prop | L |
| T11.4 | Add breadcrumbs to hub pages (`Breadcrumbs` already exists and is used on detail pages) | hub routes | S |
| T11.5 | Add `ItemList` structured data to hubs | hub routes | S |
| T11.6 | Link each country hub to the 2–3 most relevant blog posts for that country, and add a return link from those posts | hub routes + W5 | M |
| T11.7 | Trim slug and country values on import (`richTextToPlainText` returns untrimmed text). Notion is already clean; this is the guard against regression | `src/content.config.ts` | done |
| T11.8 | Investigate `/stays/italy/` returning 404 while `/projects/italy/` returns 200 — either a stay is tagged with a misspelt country, or no stay covers Italy and the dropdown is misleading | Notion data | S |
| T11.9 | Consider `noindex, follow` on paginated hub pages beyond page 1. They currently generate 115 impressions and zero clicks from 93 URLs | hub routes | S |
| T11.10 | ~~Fix `/stays/kirtipur-community-homestay/`~~ — resolved in Notion; tracked as a redirect under T11.13 | — | done |
| T11.11 | ~~Normalise slugs on import~~ — Notion is clean. Keep T11.7 as the regression guard | — | done |
| T11.12 | Add a build-time guard that fails the build if any published listing lacks a generated page, or if any slug contains a space or stray whitespace | build script | M |
| T11.13 | **Add 301 redirects for the three old malformed URLs before the next deploy** — Google has indexed all three and Kirtipur earns 2 clicks | `public/_redirects` | done |

**Caution on T11.1:** do not prune a locale hub that still earns clicks, and do not `noindex` a hub that is the only crawl path to a listing. Check the GSC export per URL before removing anything.

**What this is not:** it is not a URL restructure. The routes are fine. The work is copy, metadata, internal links and pruning — substantially cheaper than rebuilding the scheme, and it does not need to wait on the location data model session.

---

## 4. Sequence

| Phase | Contents | Why first |
|---|---|---|
| **Phase 0** — half a day | T1.1–T1.5, T7.1, T8.1–T8.3, T9.1, **T11.13 (before the next deploy)**, T11.7 | Broken or wrong today; near-zero risk — **complete 12 Nov 2026** |
| **Phase 1** — half a day | W10 entirely | Nothing later can be measured without it — **complete 12 Nov 2026** |
| **Phase 2** — 2 days | W2 entirely, plus T2.10–T2.11 (hub titles) | Where the traffic actually is — **complete 16 Nov 2026** |
| **Phase 3** — 2 days | W3, W4 | Rich results plus authorship |
| **Phase 4** — 2–3 days | W5, T11.4–T11.6 | Turns the archive into a route into the directory |
| **Phase 5** — 3–4 days | W6, W7 rest, W9 rest, T11.1–T11.2, T11.8–T11.9, T11.11–T11.12 | Consolidation and pruning, best done before new content |
| **Phase 6** — ongoing | T11.3, W9.4 | Hub copy is editorial work, one country at a time |

Phases 0–2 are roughly one week of work and capture the majority of the upside, because the impression base already exists.

T11.3 is the exception to that ordering. It is the slowest task in the plan and the one most likely to change the directory's fortunes, because it is the only task that gives 589 existing URLs something worth ranking. Start it in parallel and work through countries in order of GSC impressions — South Africa, Laos, Thailand, Iceland, Mexico, Vietnam.

---

## 5. Verification checklist

Run after each phase.

- [ ] `pnpm dev` builds with no new console errors
- [ ] `/sitemap-index.xml` fetches and lists only intended routes
- [ ] `curl -s https://giveback.guide/blog/brno/ | grep -c 'application/ld+json'` returns ≥ 1
- [ ] Rich Results Test passes for a post, a project, a stay
- [ ] No page has an empty `<meta name="description">`
- [ ] `curl -s https://giveback.guide/projects/portugal/` returns a branded title with no page count and a populated description
- [ ] No two pages share a `<title>`
- [ ] `twitter:card` uses `name=`, not `property=`
- [ ] A blog post contains at least 3 internal links, at least 1 to a listing
- [ ] Unknown URL returns HTTP 404
- [ ] Every published listing returns 200 at its canonical URL — no listing is shadowed by a country hub
- [ ] No sitemap URL contains `%20` or a stray space
- [ ] Umami receives `project_click` from a real click
- [ ] Umami country report has no Singapore block after 7 days

---

## 6. Risks and gotchas

| Risk | Mitigation |
|---|---|
| `trailingSlash: 'always'` — every internal link must end in `/`. A mismatch creates a redirect chain and wastes crawl budget | Grep for `href="/` without a trailing slash before shipping |
| Changing titles loses existing rankings temporarily | Change in batches of 5, watch GSC for 2 weeks, revert anything that drops |
| Merging duplicates can lose links and rankings | Check GSC first; 301 rather than delete; keep the stronger URL |
| Noindexing paginated pages can orphan listings | Hubs already exist as an alternative crawl path, so pagination can be noindexed — but confirm each listing also appears on a country hub first |
| Pruning locale hubs can orphan listings that have no other page | Verify each listing is reachable from its country hub and the main index before removing a locale hub |
| Notion-loaded content regenerates at build time | Any frontmatter-style change for projects must go through `src/content.config.ts`, not the MDX files |
| `BaseHead` is used by every page | Change it once, verify on a post, a listing, an index and a utility page |
| The site is static | Redirects live in `public/_redirects`, which Cloudflare Workers static assets applies as real 301s. `astro.config.mjs` redirects are **not** used: on a static build they only produce a 200 page with a meta refresh |

---

## 7. Out of scope

- Content writing, topic selection and editorial calendar — separate document
- The location data model and URL scheme decisions — separate session. W11 does not depend on them; it works with the routes as they exist
- Affiliate and advertising revenue work
- Backlink acquisition and digital PR
- Paid search

---

## 8. Verification log — 11 November 2026

Every claim in this plan was checked against the deployed build (`giveback.guide`), not just the source. Method: fetch each page, parse the rendered HTML; classify the live sitemap against `/api/items.json`; query Notion directly for data defects.

### Confirmed

| Claim | Evidence |
|---|---|
| No JSON-LD anywhere | 0 `application/ld+json` blocks on all 16 pages sampled, including home, post, both hub types and both listing types |
| `og:type` always `website` | Confirmed on the Brno post |
| Twitter tags use `property=` | 5 `property="twitter:*"`, 0 `name="twitter:*"` |
| No `og:site_name`, `og:locale`, `article:published_time` | All absent on a post |
| No author byline | Absent on post pages |
| No related-posts module | Absent on post pages |
| Sitemap contains private routes | 17 utility URLs: 7 × `/account/`, `/search/`, `/login/`, `/verify/`, `/claim/`, `/submit/`, `/report/`, 4 × `/feedback/` |
| No `noindex` on utility pages | `/search/`, `/login/`, `/verify/`, `/claim/`, `/submit/` all return no robots meta |
| `/verify/` duplicates the `/contact/` title | Both render `Contact Us` |
| Blog index has no description | `<meta name="description">` empty |
| Index and hub titles carry page numbers | `Blog - Page 1 of 8`, `All Projects - Page 1 of 49`, `All Stays - Page 1 of 7`, `Projects in Portugal - Page 1 of 1`, `Projects in Lisbon, Portugal - Page 1 of 1` |
| Hub pages have empty descriptions | Confirmed on both hub types |
| 404 "Back to Homepage" is `href="#"` | Confirmed |
| Pagination is self-canonical | `/projects/2/` canonicalises to itself |
| Posts barely link to the directory | Brno: 0 links to `/projects/`, 1 to `/blog/` |
| Card images have no alt | 9 of 10 `<img>` on `/projects/` have no `alt` attribute at all |
| Blog images have no alt | 11 of 13 `<img>` on the Brno post, because 455 of 523 post images have empty alt in source |

### Verified as already correct — no action needed

| Check | Result |
|---|---|
| 404 status code | Unknown paths return **HTTP 404**, not a soft 200 |
| RSS feed | `/rss.xml` returns 200 with 71 items |
| `robots.txt` | Declares `Sitemap: https://giveback.guide/sitemap-index.xml` |
| Canonical tags | Present and correct on posts, hubs and paginated pages |
| Trailing slashes | Consistent; `/projects/portugal` and `/projects/portugal/` both resolve |
| Footer policy links | `/about/animal-welfare/` and `/about/ai-policy/` both exist (MDX pages) |
| Account pages | `/account/dashboard/` and `/account/settings/` already `noindex, nofollow` |
| Lazy loading and `fetchpriority` | Cards lazy-load, listing heroes are eager with high priority |

### Corrected during verification

| Earlier claim | Corrected finding |
|---|---|
| "The site has no country or city hub pages" | It has 589 of them. See §1.4 |
| "Hub pages are unreachable through pagination" | They are in the sitemap and live; they are simply empty shells |
| The three malformed URLs were caused by a country field | They were caused by trailing spaces in **slug** fields |
| The three malformed URLs are broken | Notion is fixed; the live site is stale. They need redirects, not repairs |
| "17 `<img>` tags to audit" | 455 of 523 post images have empty alt text, and card images omit the attribute entirely |

---

## 9. Progress

Update this after every phase. A row per phase, with the date and what actually
shipped. Do not mark a phase complete until its §5 checks pass.

| Date | Phase | Tasks done | Checks | Notes |
|---|---|---|---|---|
| 12 Nov 2026 | Phase 0 | T1.1–T1.5, T7.1, T8.1–T8.3, T9.1, T11.7, T11.13 | Pass (local build) | See below |
| 12 Nov 2026 | Phase 1 | T10.1–T10.7 | Pass (local build) | See below |
| 16 Nov 2026 | Phase 2 | T2.1–T2.11 | Pass (local build) | See below |

### Phase 0 — detail, 12 November 2026

| Task | What shipped |
|---|---|
| T1.1 | `astro.config.mjs`: pathname prefix filter replaces `includes()`. Sitemap 1,295 → 1,278 URLs. `/for-businesses/submit/` kept deliberately. `/api/` dropped: endpoints never appear in the sitemap |
| T1.2 | `noindex, nofollow` on `/search/` |
| T1.3 | `noindex` on `/login/`, `/verify/`, `/claim/`, `/submit/`, `/account/onboarding/`, `/account/verify/`. Required adding a `noindex` prop to `GenericPage.astro` |
| T1.4 | `/verify/` → "Verify a project"; `/report/` → "Report a problem" (same duplicate-title bug) |
| T1.5 | No change. Cloudflare AI Crawl Control injects its own `User-agent: *` / `Content-Signal` block at the edge, so adding one to `public/robots.txt` would create a competing group |
| T7.1 | 404 "Back to Homepage" → `/`; added nav links to `/projects/`, `/stays/`, `/blog/`, `/search/`. T7.2 (description) left for Phase 2 |
| T8.1–T8.3 | `ogType` prop threaded `BlogPostLayout` → `MainLayout` → `BaseHead`; posts emit `article`, all else `website`. Twitter tags moved to `name=`. Added `og:site_name`, `og:locale=en_GB` |
| T9.1 | `ProjectCard` and `StayCard` alt text now uses the listing name. `/projects/` renders 10/10 images with `alt` |
| T11.7 | `normaliseUrlText()` applied to `pSlug`/`sSlug`; country and locale multi-select names trimmed. `notion-loader.ts` needed no change — it does no slug shaping |
| T11.13 | New `public/_redirects` with four 301s (three slug fixes plus the existing `/blog/announcements/` rule moved out of `astro.config.mjs`) |

**Verification.** `pnpm run build` clean, 1,300 pages. Sitemap has zero utility routes and zero `%20` entries. `/search/` and `/verify/` carry `noindex, nofollow`. Posts render `og:type=article`, hubs `website`. No `property="twitter:*"` remains. 404 has no `href="#"`. Redirects were tested against `wrangler dev`: all four return `301` with the correct `Location`, and non-matching URLs still return 200.

**Not yet verified:** the 301s on the live domain — that needs the deploy. Run the three `curl` checks in the Handoff section afterwards.

**Noted, not fixed (out of scope):** every page without an explicit description still renders `<meta name="description">` with no content. That is T2.8. Listing titles from Notion can still carry trailing spaces (e.g. "Kirtipur Community Homestay ") — T11.7 trims slugs and country values only, per the task text.

### Phase 1 — detail, 12 November 2026

| Task | What shipped |
|---|---|
| T10.1 | Cards (`ProjectCard`, `StayCard`) and `ListingEmbed` carry `data-umami-event`, `-slug` and `-source_page={Astro.url.pathname}`. `ActionBar` and `GetInvolvedBox` fire `outbound_click` with `link_type` of `website`, `map`, `social` or `booking`, classified from the existing icon props. `ProjectPage`/`StayPage` pass a new `listingSlug` prop; `search.astro` builds the same attributes in `createResultCard()` using the slug from the result URL. All static attributes — no JavaScript |
| T10.2 | New `src/lib/analytics.ts` (`trackEvent`, guarded against the deferred tracker). `NewsletterForm` takes a required `placement` prop and derives `source` as `placement:section` from `Astro.url.pathname` at build time. The inline `define:vars` script was replaced with a bundled script that binds every `[data-newsletter-form]` instance and reads its config from data attributes, so duplicating the component now works. Default id is `newsletter-${placement}` |
| T10.3 | `data-domains="giveback.guide"` on the Umami script. Exact hostname match, so `www`, translated copies, localhost and `heretotravel.com` all stop recording |
| T10.4 | Nothing to enable in Umami: bot filtering is server-side `isbot` and is on by default. The Singapore block (1,636 of 1,670 visitors on Windows 10/Chrome, against a mobile-heavy GB/US audience) is spoofed user-agent traffic. Blocked at the ingest hostname with a Cloudflare WAF rule, deployed by the owner on 12 Nov 2026 |
| T10.5 | `data-performance="true"` added — the attribute was missing, which is the whole reason for 0 measurements |
| T10.6 | `member_signup` fires once onboarding saves, before the redirect to the dashboard |
| T10.7 | `search_performed` fires from `performSearch()` with `query` and `results`, including the zero-results branch, and only when the query changed |

**Verification (local build).** 1,300 pages, no errors. `dist` contains: 18 `project_click` anchors on `/projects/` (two per card) and 18 `stay_click` on `/stays/`, each with the correct slug and `source_page`; all four `link_type` values on a project page with booking links (`nuttintodo`), both `website` and `booking` on a stay page; the Umami tag with `data-domains` and `data-performance`; newsletter `source` values of `footer:site-wide` (home), `footer:blog` (post), `footer:projects`, `footer:stays`. The three JS events live in bundled chunks, not inline scripts.

**Not yet verified:** live clicks, `newsletter_signup`, `member_signup`, `search_performed` and Core Web Vitals all need the deploy. After it, check with the Umami MCP `get_events` and `get_performance`.

**Noted, not instrumented:** blog results in site search carry no click event, because `project_click`/`stay_click` are the only listing events defined. A hub result clicked from search (e.g. `/projects/portugal/`) is indistinguishable from a listing at the same path depth, so it will report as a `project_click` with the country as its slug. `GetInvolvedBox` is instrumented but not currently imported anywhere.


### Phase 2 — detail, 16 November 2026

| Task | What shipped |
|---|---|
| T2.1 | New `src/utils/seo.ts`. `buildTitle()` takes an ordered list of candidates and returns the first that fits inside 60 characters with `\| Give Back Guide`, so a long country name degrades to a shorter phrasing rather than truncating. Page numbers appear only on page 2+ and read `— Page N`, never "of M". `alwaysBrand` keeps the brand on authored content |
| T2.2 | All 12 pages in §1.3 retitled to lead with search intent: decision queries ("Is Brno Worth Visiting?"), numbered promises ("13 Things to Know") and concrete hooks. All are 60 characters or fewer with the brand |
| T2.3 | The same 12 descriptions rewritten to 140–155 characters, each naming the primary query plus a concrete detail from the page |
| T2.4 | `/blog/`: `Travel Blog: Regenerative Travel Guides \| Give Back Guide` on page 1, `Travel Blog — Page N` after that. Description added |
| T2.5 | `/projects/`: `Regenerative Travel Projects \| Give Back Guide`, with a description naming the listing types and filters |
| T2.6 | `/stays/`: `Sustainable Stays & Eco Hotels \| Give Back Guide`, with a description |
| T2.7 | Tag pages: `Travel Advice \| Give Back Guide`, page numbers only on 2+. The four tag descriptions in `src/lib/blog-tags.ts` were expanded to 140–155 characters and a truncated one ("…our top travel advice,") was fixed |
| T2.8 | `BaseHead.astro` falls back to `defaultDescription(pathname)` when a page passes nothing, and uses the resolved value for `description`, `og:description` and `twitter:description`. Section-aware copy covers about, for-businesses, feedback, contact, support, sustainability and submit, plus a site-wide default |
| T2.9 | Re-scoped with the owner: no wholesale content rewrite. Added `scripts/seo-audit.mjs` and `pnpm run seo:audit`, which reads `dist/`, skips noindex and meta-refresh pages, and reports long titles, missing/short/long descriptions and duplicate titles by section. Every template-level title was fixed; the remaining long titles are authored listing and post titles, recorded below as backlog |
| T2.10 | Country hubs carry the raw Notion country name, so "USA" no longer renders as "Usa". Titles use the `Regenerative Travel Projects in {country}` ladder, falling back to `Regenerative Projects in {country}` for the nine countries where the longer form exceeds 60 characters. Descriptions are generated from the real listing count, the two most common cities and two most common impact areas |
| T2.11 | Locale hubs use the same approach, starting at `Regenerative Projects in {locale}, {country}`, with raw locale names. Stay hubs use `Sustainable Stays in …`, falling back to `Eco Stays in …` and then `Stays in …` |

**Also fixed in this phase:** the homepage was a template-level title and description both over the limit (76 and 167 characters); it now reads `Give Back Guide: Regenerative Travel Directory` with a 144-character description, which also removes the "Giveback" typo. Two posts still had descriptions under 120 characters and were rewritten. Static pages that shipped no description (~18) now have one, `/about/verification/` was retitled "How Verification Works", and the duplicate `/about/about/` page was deleted (1,299 pages, down from 1,300).

**Verification.** `pnpm run build` clean. `pnpm run seo:audit` reports 1,283 indexable pages after skipping 17 noindex or meta-refresh pages:

- **Descriptions:** zero missing, zero under 120 characters. 62 over 155, all authored content (54 blog posts, 5 stays, 3 projects).
- **Titles:** 531 over 60 characters, all authored listing or post titles (419 projects, 57 posts, 55 stays). No template-level title remains over the limit.
- **Duplicates:** one group — two Marine Conservation Society projects share an identical `pTitle` in Notion. They cannot be distinguished at build time and need a manual edit.

Spot-checked in `dist`: `/projects/`, `/stays/`, `/blog/`, `/blog/2/`, tag pages, `/projects/portugal/`, `/projects/usa/`, `/projects/usa/alaska/`, `/stays/usa/`, `/projects/northern-ireland/county-armagh/` and the 12 rewritten posts. No `Page 1 of N` remains, no "Usa"/"Uk" labels remain, page numbers appear only on page 2+, and every sampled description is 120–155 characters.

**Backlog (documented, not rewritten).** Long titles come from the listing name itself, so shortening them means editing each Notion record, not a template. Worst at the time of writing: `/stays/murchison-river-lodge/` (126), `/stays/good-hotel-guatemala-city/` (120), `/projects/quetzaltrekkers/` (117). Descriptions over 155 are mostly posts whose description was written for social sharing. Blog may move to Sanity, so the audit is deliberately CMS-agnostic.

**Not yet verified:** live titles and CTR movement need the deploy and several weeks of GSC data.

---

## Appendix A — Title and description formula

```
Title:    <primary query in natural language> — <specific hook> | Give Back Guide
          (≤ 60 characters total)

Desc:     <what the page answers>. <a concrete detail from the page>.
          (140–155 characters)
```

Worked example for the Brno page:

- **Before:** `Brno: 11 Reasons Why You'll Love Czechia's Quirky Second City - Give Back Guide`
- **After:** `Is Brno Worth Visiting? Yes — Here's Why | Give Back Guide` (57 characters)
- **Description:** `Cheap beer, a quirky astronomical clock and no crowds: what to see, where to eat and how to give back in Czechia's underrated second city for a weekend.` (152 characters)

The current title is a listicle; the ranking page is a decision. Matching the title to the query is what moves CTR at position 11.

---

## Appendix B — Event attribute pattern

```html
<a
  href={`/projects/${slug}/`}
  data-umami-event="project_click"
  data-umami-event-slug={slug}
  data-umami-event-source-page={Astro.url.pathname}
>
```

Umami picks up any `data-umami-event-*` attribute as an event property.
