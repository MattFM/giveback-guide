# Give Back Guide — Roadmap and Backlog

**Created:** 9 November 2026
**Location:** `docs/plans/roadmap.md`
**Last reviewed:** 9 November 2026 — bucket 1 complete and verified live. Next: bucket 2 (locations).
**Status:** Working document. Not a commitment to do everything.

---

## How to use this document

There are four buckets here, and they are **not** one list. Only bucket 1 is urgent.

When a new worry arrives, ask one question:

> **Does this block the next step from working?**

If no → it goes in bucket 4, with no date. That's the whole rule. Ideas are not emergencies.

---

## Bucket 1 — Something is wrong now

### 1.1 The AI policy contradiction — ✅ COMPLETE (9 Nov 2026)

**Policy:** Search allowed. Training blocked. Assistants welcome to read on a human's behalf, but not to train models.

**Verified live after deploy:**

| Where | State |
|---|---|
| `/about/ai-policy/` | ✅ "We block AI training crawlers. We allow search engines and AI assistants to read our pages on a human's behalf, but not to train models on them." |
| `robots.txt` | ✅ Cloudflare block + comment + `Sitemap:` only. No manual AI entries. |
| `Content-Signal` | ✅ `search=yes, ai-train=no, use=reference` |
| Training crawlers | ✅ 32 blocked, including `Applebot-Extended` and `Google-Extended` |
| Search crawlers | ✅ `Googlebot`, `BingBot`, `Applebot` untouched |
| Assistants | ✅ `ChatGPT-User`, `Claude-User`, `Perplexity-User`, `OAI-SearchBot`, `Claude-SearchBot` absent from the file, i.e. allowed |

Re-verify any time with:
```
curl -s https://giveback.guide/robots.txt | grep -E 'Content-Signal|Applebot'
```

**Known quirk, no action needed:** Cloudflare's training list includes `Baiduspider` and `PetalBot`, so the crawler table's Allow for Baidu is overridden. Irrelevant for a UK audience.

**Dropped as a result of removing the manual block:** `FacebookBot`, `ImagesiftBot`, `YouBot` and `Omgili` are no longer explicitly blocked, because Cloudflare's list doesn't cover them. Meta's current AI crawler `meta-externalagent` *is* covered. Revisit only if any of them becomes a nuisance.

**Optional, not done:** `ai-input` is absent from the Content-Signal, so per Cloudflare's own preamble it "neither grants nor restricts" AI-answer and grounding use. Declaring `ai-input=yes` would make the encouragement explicit rather than implicit.

**Decisions applied to the crawler table (32 bots, 20 Allow / 12 Block)**

Block: `Amazonbot`, `Anchor Browser`, `Bytespider`, `CCBot`, `ClaudeBot`, `FacebookBot`, `Google-CloudVertexBot`, `GPTBot`, `Meta-ExternalAgent`, `Novellum AI Crawl`, `PetalBot`, `TikTok Spider`

Allow: `Applebot`, `archive.org_bot`, `Arquivo`, `Baidu`, `BingBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `Cloudflare Crawler`, `DuckAssistBot`, `Googlebot`, `Manus Bot`, `Meta-ExternalFetcher`, `MistralAI-User`, `OAI-SearchBot`, `Perplexity-User`, `PerplexityBot`, `ProRataInc`, `Terracotta Bot`, `Timpibot`

Judgement calls to revisit if they matter later: `Google-CloudVertexBot` (blocked — no citation guarantee, but could become a licensing channel) and `TikTok Spider` (blocked — reverse to Allow if link previews break).

**Note on the dashboard list:** it did not include several bots that appeared in the earlier managed `robots.txt` (`Google-Agent`, `Google-NotebookLM`, `FireCrawl`, `Instapaper`, `Retool`, `ChathiveCrawler`, `Kimi-User`, `Amzn-User`). Those came from a Cloudflare default list, not from settable actions. They have now disappeared along with the rest of the managed block — acceptable, since agents are allowed anyway, but worth knowing they were never individually controllable.

**Still open:** decide what `/api/items.json` should do (see 4.3). A public bulk export of the whole dataset is the one remaining thing that contradicts the "access on a human's behalf" framing.

**Definition of done:** policy page, `robots.txt` and Cloudflare all state the same three-part policy, and the file is deployed.

### 1.2 Dead entries in the manual robots block — DONE

Resolved by deleting the whole block. The stale `Applebot`, `Claude-Web`, `anthropic-ai`, `Omgili`, `YouBot` entries went with it, and so did `/docs/` and `/join/organiser/` (both return 404, so nothing was lost).

---

## Bucket 2 — Structure (next project, own chat)

This is the October 2025 plan (a Notion "Locations" database) combined with the web-layer plan. They are two layers of one job:

- **Data layer** — one Locations database, so each place exists once.
- **Web layer** — what URLs those locations get, which get pages, how old addresses redirect.

**Order matters: data first, website second.**

### 2.0 Before starting: take a snapshot

- [ ] Save the current sitemap URL list to a file (`https://giveback.guide/sitemap-0.xml`)
- [ ] Record Search Console indexed-page count
- [ ] Record top 10 pages by clicks
- [ ] Record expected new URL for 20 sample pages

### 2.1 Three adjustments to the October plan

1. **Two levels is not enough for the UK.** Use one Locations database that can point at itself: `Type` (Country / Nation / Region / City) + `Parent` (link to another location). Handles UK → Wales → Cardiff, and Spain → Andalusia → Seville later.
2. **Listings have several locations.** Current fields are multi-select; some projects have 3+ countries. Add **one "Primary location"** (generates the URL) plus **"Also relevant in"** (renders as links). Without a single primary, no page can be the listing's home.
3. **Same-name places.** Always include the parent in the URL: `/locations/spain/valencia/` and `/locations/venezuela/valencia/` can coexist. City names only need to be unique within their parent.

### 2.2 Data migration — five steps, in Notion only

The site reads Notion at build time and validates strictly, so **a half-migrated database breaks the build**. Do all of 2.2 while the site still reads the old fields.

- [ ] **Step 1 — Take stock.** Export distinct `Country` and `Locale` values from both databases to a spreadsheet. This is where "Tblisi", "Uk", "Usa" and the UK/England/Scotland overlaps surface. Clean it here.
- [ ] **Step 2 — Build the Locations database.** Fields: Name, Slug, Type, Parent, Status, **Intro copy** (doubles as the location page's missing search description), Aliases, optional image/coordinates.
- [ ] **Step 3 — Seed it.** Countries first, then the four UK nations, then the cities/regions that actually have listings. A few hours, once.
- [ ] **Step 4 — Connect.** Add "Primary location" and "Also relevant in" to Projects and Stays. **Leave the old Country/Locale fields untouched** as a safety net. Script the matching via the Notion API, then spot-check.
- [ ] **Step 5 — Switch the website.** Only after the data is complete: update `src/content.config.ts`, generate new URLs, emit redirects, retire old fields.

### 2.3 UK model

- Hierarchy: **UK → nation → region/city → listing**
- Four nation pages are canonical and indexable: England, Scotland, Wales, Northern Ireland
- `/uk/` is a **hub**, not another copy of the listings: unique intro, links to the nations, a few highlights. If it duplicates the nation pages it competes with them.
- Breadcrumbs follow the hierarchy: United Kingdom › Scotland › Highland › Findhorn Ecovillage
- Search synonyms ("Britain", "Great Britain", "GB") go in a **new** everyday-synonyms list — **not** in `src/data/country-aliases.ts`, which exists for indigenous/endonym acknowledgments (Aotearoa, Cymru, Alba) and has a different purpose.

### 2.4 URL and redirect rules

- [ ] **Keep individual listing URLs unchanged where possible** (`/projects/{slug}/`, `/stays/{slug}/`). Those are the pages that rank. Restructure only the hub/location pages — far lower risk.
- [ ] Generate the redirect map from Notion at build time, not by hand
- [ ] Keep redirects permanently
- [ ] One release, not a gradual switch
- [ ] **Do not also change titles/descriptions in the same release** — otherwise a traffic dip can't be diagnosed
- [ ] Verify a sample of old URLs after deploy

### 2.5 Location page threshold

- [ ] Compute it in the build from the listing count (e.g. build a page at 3+ listings), so pages appear and disappear automatically
- [ ] Allow a manual override only for the handful of places to feature deliberately
- [ ] **Orphan check:** every listing must be linked from at least one page that exists. Country-level pages can carry this.

### 2.6 Expectations

Rankings will wobble for roughly 2–6 weeks. That is normal for a URL change.

**Come back for reassessment 4–6 weeks after the migration**, bringing the 2.0 snapshot numbers, the new sitemap list, the new page count, and any listing that lost its parent page.

---

## Bucket 3 — SEO improvements (after bucket 2)

Ordered by value. All of these get easier once the URL structure is settled.

### 3.1 Page titles are too long

Search results show roughly 60 characters before truncating.

| Page | Current length |
|---|---|
| Homepage | 76 |
| Project | 79 |
| Stay | 115 |

The suffix "— Projects on Give Back Guide" is 31 characters, pushing the distinctive words off the end.

- [ ] Shorten to something like ` | Give Back Guide`
- [ ] Keep the descriptive part to about 45 characters
- **Files:** `src/layouts/ProjectPage.astro`, `StayPage.astro`, plus listing templates

### 3.2 About 1,000 pages have no description

Missing on every listing page, category page, paginated page and `/about/`.

- [ ] Add a default description to `BaseHead.astro` rather than per page
- [ ] Fractional improvement only — affects click-through, not ranking

### 3.3 Descriptions are identical across all listings

Every listing currently reads: *"Give back to the local community in {place} by engaging with {name} on your next trip."*

**The owner's proposal — an SEO description property — is correct.** Notes:

- [ ] Add **two** Notion fields: "SEO Title" and "SEO Description". Titles matter more and are currently truncated.
- [ ] Make both **optional** in the data schema so a missing value can't break the build
- [ ] Build a good automatic fallback first (place + type + impact areas + country), so nothing gets worse while filling them in
- [ ] Write manual descriptions for high-value pages first — use Search Console: pages with impressions but few clicks
- [ ] Do **not** reuse `pReview`/`sReview` — these are testimonial quotes shown in `VerificationBox.astro`
- [ ] Keep under ~155 characters; don't duplicate the page heading

### 3.4 No structured data anywhere

Verified: zero `application/ld+json` on the homepage, a blog post and a stay page.

- [ ] `Organization` + `WebSite` with `SearchAction` (sitewide, in `BaseHead.astro`)
- [ ] `BlogPosting` with author, datePublished, image
- [ ] `TouristAttraction` for projects, `LodgingBusiness`/`Hotel` for stays
- [ ] `BreadcrumbList` on listing pages
- [ ] `ItemList` on location hub pages
- **Approach:** one shared `<JsonLd>` component plus a prop per layout. No visual change.

### 3.5 Thin location pages (solved by bucket 2)

Evidence: 1,295 sitemap URLs for 496 listings. 404 country/locale pages, of which a sample of 18 showed 15 with only 1–2 listings, all titled "Page 1 of 1".

- [ ] Mostly resolved by the threshold in 2.5 — revisit after the migration

### 3.6 Sitemap contains pages that are noindex

`astro.config.mjs` filters only `/docs/` and `/design/`. The sitemap also submits `/account/*` (7), `/login/`, `/claim/`, `/report/`, `/search/`, `/feedback/*`.

- [ ] Add these to the sitemap filter
- [ ] `/search/` should probably be noindex entirely

### 3.7 Images have no alt text

Card images ship with **no alt attribute at all** — Astro drops empty-string values, so `alt=""` disappears from the HTML.

- [ ] Derive alt text from existing data on cards: `{title}, {location}` — e.g. "Eaton HK, Hong Kong"
- [ ] Add an optional Notion "Image description" field later, for the main photo only
- [ ] Use the stock-photo flag honestly: "Stock photo of a cafe interior"
- **Files:** `ProjectCard.astro:23`, `StayCard.astro:20`, `BlogPostCard.astro:24` (already correct)

### 3.8 Small fixes

- [ ] `<html lang="en">` → `en-GB` (`src/layouts/MainLayout.astro:27`)
- [ ] `og:type` is `website` on blog articles → `article` + published time
- [ ] No author byline on blog posts (trust signal; add `author` to frontmatter)
- [ ] Set up Bing Webmaster Tools (Google is verified via DNS; Bing appears not to be)
- [ ] Add IndexNow for near-instant Bing indexing
- [ ] Data hygiene: "Tblisi" → Tbilisi, "Uk" → UK, "Usa" → USA in titles and headings

### 3.9 Data quality

- [ ] Fix place-name spelling and capitalisation at source (mostly covered by 2.2 Step 1)

---

## Bucket 4 — Parked. No date. Not urgent.

Each of these is a real idea. None blocks the next step.

- **Move the database from Notion to self-hosted Baserow.** Correct order is *last*, after bucket 2. Moving platform doesn't change what the data is; restructuring does. Do the restructure first and the move becomes a straight copy of a clean model rather than migrating twice. Also note the trade: self-hosting replaces "no control" with owning uptime, upgrades, security patches and 3am failures.
- **Notion backup — DECIDED (9 Nov 2026): manual, not scripted.** Weekly-or-as-needed export. Caveats: use **Export → Markdown & CSV**, not CSV alone — CSV carries database properties only, and the site's listing pages are built from page *bodies*, which only the Markdown part includes. Store it off-device in dated folders, and open the zip occasionally to confirm it contains what you think. Treat it as a content archive rather than a restorable database: relations export as names, not stable IDs, so a future Baserow import would still need relations rebuilt.
- **`llms.txt`.** Do not add. No major AI provider consumes it; it cannot drive human traffic; it contradicts the AI policy page.
- **`/api/items.json`.** Currently returns the entire dataset (496 items, 147 KB) to any unauthenticated request, used only by `account/dashboard.astro` and `account/list.astro`. A public bulk export undermines any "accessible only to humans" claim. Options: Cloudflare challenge on non-browser traffic, inline the index at build time, or amend the policy wording. Revisit alongside 1.1.
- **Homepage meta description is 167 characters** — slightly long, minor.
- **Trailing-slash redirects are 307 (temporary) rather than 308** — works fine; cosmetic.
- **Combining projects and stays on one landing page** — part of bucket 2, but watch for title/intent overlap with individual listing pages.

---

## Sequencing summary

1. **Done:** bucket 1 (AI policy) — complete and verified live 9 Nov 2026.
2. **Next project:** locations restructure, in its own chat (bucket 2).
3. **Then:** SEO improvements, against the final URL structure (bucket 3).
4. **Later, maybe:** platform move (bucket 4), from a position of having clean weekly exports.

---

## Decisions still open

| # | Decision | Blocks |
|---|---|---|
| 1 | ~~Is AI training allowed or not?~~ | **Settled 9 Nov 2026:** search allowed, training blocked, assistants allowed. Only the Cloudflare setting remains. |
| 2 | Keep individual listing URLs unchanged during the migration? | Bucket 2 risk profile |
| 3 | How many listings before a location page is built? | 2.5 |
| 4 | Is Baserow still wanted after the restructure? | Bucket 4 |
| 5 | Should `/api/items.json` stay public? | 1.1 consistency |
| 6 | ~~Scripted backup or manual export?~~ | **Settled 9 Nov 2026:** manual Notion export, weekly or as needed. |

---

## What could not be assessed from outside

- Actual rankings, search terms and click-through — needs Search Console
- Real page-speed scores from visitors
- Inbound links (needs a paid tool)
- Whether Notion data is complete across all listings
- Whether the October 2025 plan's specifics are still current — it predates Notion's database/data-source API change and Astro 7. Treat it as a draft to re-check, not instructions.

---

## Change log

**9 Nov 2026 — bucket 1 closed**
- Policy page wording rewritten to match the chosen policy.
- Manual AI block removed from `public/robots.txt`; stale entries and two 404 path rules gone.
- 32 crawlers triaged in Cloudflare: 20 Allow / 12 Block.
- **Regression found, then fixed:** setting the global purpose settings to "Allow" stopped Cloudflare injecting the managed block at all. Setting Training = Disallow restored it.
- Deployed and verified live: `Content-Signal: search=yes, ai-train=no, use=reference`, 32 training crawlers blocked, `Applebot`/`PerplexityBot`/`ChatGPT-User`/`YouBot`/`ImagesiftBot` absent from the file, policy page serving the new wording.
- Section 1.2 closed as done.
- **Decision:** Notion durability handled by a manual Markdown & CSV export, weekly or as needed. No scripted backup. Caveats recorded in bucket 4.
