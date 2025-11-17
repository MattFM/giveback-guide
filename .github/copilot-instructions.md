# Giveback Guide - AI Coding Agent Instructions

## Project Overview

**Giveback Guide** is a curated travel platform helping conscious travelers make better choices by replacing typical tourist activities with alternatives that have a positive impact on people, places, and the planet. Users discover and explore:
- **Projects**: Animal sanctuaries, cultural exchanges, NGOs, and community initiatives to visit instead of exploitative tourism
- **Stays**: Sustainable accommodations (eco-lodges, social enterprises, community-owned properties)
- **Blog**: Travel guides and impact stories

### What Makes It Different
- **Verification-first**: Projects/stays are vetted for authenticity and impact
- **Impact tracking**: Filter by SDG-like impact areas (animal welfare, education, conservation, etc.)
- **User features**: Save items to lists, mark as completed, track your impact journey
- **Free focus**: Many opportunities are free or low-cost
- **Better choices**: Replace harmful tourism with meaningful alternatives

### Tech Stack
- **Frontend**: Astro 5 (SSG) with TailwindCSS 4, static-first approach
- **Content**: Notion databases loaded at build time (posts, projects, stays)
- **Backend**: Supabase for auth, user lists, and completion tracking
- **Deployment**: Cloudflare Workers via GitHub Actions
- **Search**: Pagefind for fast client-side search
- **Images**: Cloudinary with responsive optimization

## Core Principles

### Suggest First, Act Second
- **Default behavior**: Make suggestions and explain options before implementing
- **When to suggest**: Complex changes, multiple approaches possible, architectural decisions, user seems uncertain
- **When to act directly**: 
  - Simple, obvious tasks (fix typo, add console.log, update a single value)
  - User explicitly requests immediate action ("just do it", "go ahead", "implement this")
  - Follow-up tasks after user approves a suggestion
- **How to decide**: If the task could be done multiple ways or has trade-offs, suggest first
- **Always explain**: Even when acting directly, briefly explain what you're doing and why
- **Finishing up**: When a task feels complete and no more adjustments are being made, offer a brief commit message suggestion

### Accessibility First (WCAG Compliance Required)
- **All features MUST meet WCAG 2.1 AA standards** (Level AAA where feasible)
- If a request conflicts with accessibility requirements, **push back** and suggest accessible alternatives
- Required considerations:
  - Semantic HTML structure (proper heading hierarchy, landmarks)
  - Keyboard navigation for all interactive elements
  - ARIA labels and roles where native HTML is insufficient
  - Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
  - Focus indicators visible and clear
  - Screen reader compatibility (test with announcements)
  - No reliance on color alone to convey information
  - Proper alt text for images (empty `alt=""` for decorative)

### Development Environment
- **Dev server runs continuously** (`npm run dev`) - assume it's already running
- Don't prompt to start dev server unless specifically needed for troubleshooting
- Changes to `.astro` files hot-reload automatically
- Content changes require rebuild (`npm run build`) as content is loaded at build time

### Code Over Documentation
- **Actual implementation always supersedes documentation** - if code conflicts with `/docs` content, trust the code
- The `/docs` directory contains historical references and experiments; live codebase is the source of truth
- When in doubt, examine actual component files, not documentation pages

## Architecture & Data Flow

### Content Management (Notion-Powered)
- **Content lives in Notion**: All blog posts, projects, and stays are managed in Notion databases
- Content is loaded at **build time** via `@chlorinec-pkgs/notion-astro-loader` in `src/content.config.ts`
- Three collections: `posts`, `projects`, `stays` with strict schema validation
- Each collection filters for `Status = "Published"` in Notion
- **Critical**: Custom ID fields (`pID`, `sID`) use Notion's `unique_id` property with `{prefix, number}` format (e.g., `PRO-777`, `STY-123`)

### Static Site Generation Pattern
All dynamic routes use `getStaticPaths()` to pre-render at build time:
```typescript
// Example: src/pages/projects/[...slug].astro
export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { slug: project.data.properties.pSlug },
    props: project,
  }));
}
```

### User Features (Supabase + Client-Side)
- **Authentication**: Magic link (OTP) via Supabase, abstracted in `src/lib/supabase.ts`
- **Saved Lists**: Users can save projects/stays to custom lists (RLS-protected in Supabase)
- **Completion Tracking**: Users mark items as "done" (`user_item_status` table)
- **Client-side hydration**: Auth checks happen in browser via `getCurrentUser()` parsing localStorage
- Database tables: `lists`, `list_items`, `user_item_status` (see `migrations/`)

### Image Optimization
- **Cloudinary** for responsive images via `src/utils/cloudinary.ts`
- Use `ResponsiveImage.astro` component with preset configurations (`RESPONSIVE_PRESETS.card`, `.hero`, etc.)
- Automatically generates `srcset` with multiple widths and `f_auto` (format optimization)
- Can disable transformations globally via `CLOUDINARY_CONFIG.enableTransformations = false`

## Component Architecture

### Component Organization
```
src/components/
├── content/        # Content display cards (PostCard, ProjectCard, StayCard)
├── features/       # Feature-specific (save/, ads/, popups/)
├── layout/         # Site structure (Header, Footer, NavigationDrawer)
├── sections/       # Homepage sections (HomeHero, LatestPosts)
├── ui/             # Reusable UI (Button, InfiniteScroll, Dropdown/, Image/)
└── utility/        # Non-visual (Analytics, TestListsClient)
```

### Key Component Patterns

**Metadata Pills** (e.g., `ProjectMetadata.astro`, `StayMetadata.astro`):
- Display operator, types, locales, countries as clickable filter links
- Two formatting modes: simple (`"Brighton, UK"`) vs. complex (`"in X & Y in A & B"`)
- Location pills link to `/projects/{country}/{locale}` routes

**Card Components** (PostCard, ProjectCard, StayCard):
- All use `ResponsiveImage` with `preset="card"`
- Consistent structure: image → metadata pills → title → description
- Project/Stay cards include save/done actions (client-side)

**Dropdowns** (`src/components/ui/Dropdown/`):
- Filter by country/locale/category/tags
- Each dropdown fetches full collection at build time and extracts unique values
- Example: `ProjectCountryDropdown.astro` → `getCollection('projects')` → extract all `pCountry` values

## Development Workflows

### Build & Deploy
```bash
npm run dev        # Local dev server (Astro) - runs continuously
npm run build      # Build static site for testing (outputs to dist/)
```

**Deployment Process**:
- Commits synced to GitHub trigger a GitHub Action
- Action automatically builds and deploys to Cloudflare Workers
- `wrangler.jsonc` is used by the action, not locally
- `npm run preview` and `npm run deploy` are not used in typical workflow

**Important**: `--no-deprecation` flag in build script suppresses Node warnings from Notion loader

### Database Migrations
- SQL files in `migrations/` directory are **reference only**
- Content is manually copied/pasted into Supabase dashboard SQL editor
- Not executed directly via CLI
- Keep files for documentation and version control
- RLS policies are critical: all user data tables require `auth.uid() = user_id` checks

### Adding New Content Types
1. **User creates Notion database** manually and provides ID
2. Update `src/content.config.ts` with new collection + schema
3. Transform rollup properties for relations (see `pTypesNames`, `pImpactsNames` examples)
4. Create card component in `src/components/content/`
5. Add dynamic routes in `src/pages/[collection-name]/`

## Project-Specific Conventions

### Naming Prefixes
- Blog: `b` prefix (`bTitle`, `bTags`, `bSlug`)
- Projects: `p` prefix (`pTitle`, `pCountry`, `pSlug`)
- Stays: `s` prefix (`sTitle`, `sCountry`, `sSlug`)
- **Why?** Distinguishes properties from different Notion databases with identical field names

### URL Patterns
- Blog: `/blog/[slug]` and `/blog/[tag]/[page]`
- Projects: `/projects/[slug]`, `/projects/[country]/[page]`, `/projects/[country]/[locale]/[page]`
- Stays: `/stays/[slug]`, `/stays/[country]/[page]`, `/stays/[country]/[locale]/[page]`
- All use trailing slashes (`trailingSlash: 'always'` in `astro.config.mjs`)

### Authentication Abstraction
- `src/lib/supabase.ts` provides authentication via Supabase
- Use exported functions: `getCurrentUser()`, `createMagicURLSession()`, `logout()`
- Lazy initialization prevents build-time errors when env vars missing
- Legacy: Some function names (like `account` object) may reference old Appwrite patterns but now use Supabase

### Component Hydration
- Most components are server-rendered Astro components (`.astro`)
- Client interactivity via `<script>` tags or `.client.js` files
- Example: `SaveToList.astro` has inline `<script is:inline>` that waits for `window.SaveToListAPI`

### Accessibility in Components
- Every interactive component must be keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`)
- Buttons need proper `aria-label` or visible text, never icon-only without labels
- Modals/drawers require focus trapping and return focus on close
- Form inputs must have associated `<label>` elements (not just placeholder text)
- Loading states should announce to screen readers (`aria-live="polite"`)
- Example: `SaveToList.astro` includes `aria-expanded`, `aria-controls`, `aria-pressed` attributes

## Pitfalls & Gotchas

1. **Notion Rollup Properties**: Rollups return nested structures; must transform with `.transform()` in schema (see `pTypesNames` for array extraction)
2. **Item IDs**: Must be strings (`String(itemId)`) when saving to Supabase `item_id` column (migration 002 normalized this)
3. **Auth in Static Sites**: User state lives in localStorage; use `getCurrentUser()` which parses Supabase session tokens
4. **Search**: Pagefind integration runs post-build; search UI in `src/pages/search.astro`
5. **Dark Mode**: TailwindCSS `dark:` classes are used throughout components, but no theme toggle is currently implemented
6. **Docs Directory**: `/docs/` is excluded from sitemap and robots.txt (internal use only)

## Key Files Reference

- **Content schemas**: `src/content.config.ts` (Notion loader + Zod schemas)
- **Database client**: `src/lib/supabase.ts` (auth + account helpers)
- **Lists logic**: `src/lib/lists.ts` (CRUD for saved lists)
- **Completion tracking**: `src/lib/completed.ts` (mark items as done)
- **Image utils**: `src/utils/cloudinary.ts` (responsive image generation)
- **Site config**: `astro.config.mjs` (MDX, sitemap, Pagefind)
- **Deployment**: `wrangler.jsonc` (Cloudflare Workers settings)

## Environment Variables

Required for development and deployment:

**Notion (Content Management)**:
- `NOTION_TOKEN` - Notion integration token for API access
- `BLOG_NOTION_DATABASE_ID` - Database ID for blog posts
- `PROJECTS_NOTION_DATABASE_ID` - Database ID for projects
- `STAYS_NOTION_DATABASE_ID` - Database ID for stays

**Supabase (Database & Auth)**:
- `PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `PUBLIC_SUPABASE_ANON` - Supabase anonymous/public API key (public)

**Cloudinary (Image Optimization)** - Optional:
- Images are optimized via Cloudinary URLs in Notion; no API key needed client-side

## API Endpoints

**`/api/items.json.ts`** - JSON endpoint for fetching item data
- Used by client-side features to retrieve project/stay information
- Supports item type and ID parameters
- Returns structured data for use in JavaScript components

## Testing & Debugging

**No formal test suite** - all testing is currently manual:
- Local development: `npm run dev` for Astro dev server (runs continuously)
- Build testing: `npm run build` to test production build locally
- Auth flows: Test via `/login` and `/account/dashboard` pages
- Saved lists API: Test in browser console with `await window.SaveToListAPI.getLists()`
- Check localStorage: Look for `sb-*-auth-token` keys for session data
- Notion sync: Content updates require rebuild (`npm run build`) to reflect changes
- Deployment: Push to GitHub to trigger automatic build and deploy

## When Making Changes

- **Adding fields**: Update Notion database → update schema in `content.config.ts` → rebuild
- **UI changes**: Components are mostly in `src/components/`; layouts in `src/layouts/`
- **Database changes**: Create new migration in `migrations/` with sequential numbering
- **New features**: Follow existing patterns (e.g., new dropdown → copy `ProjectCountryDropdown.astro`)
- **Debugging auth**: Check browser localStorage for `sb-*-auth-token` keys
- **Accessibility check**: Before completing any UI change, verify keyboard navigation, ARIA attributes, and screen reader compatibility
