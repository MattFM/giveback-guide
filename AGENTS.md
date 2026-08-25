# AGENTS.md - Development Guidelines for AI Coding Agents

## Build/Lint/Test Commands

```bash
# Development
pnpm dev              # Start Astro dev server (runs continuously)
pnpm run build            # Build for production (uses --no-deprecation flag)

# Content Management
pnpm run astro            # Direct Astro CLI access
```

**Testing**: No formal test suite. Use manual testing:
- `pnpm dev` for development testing (runs continuously - **build verification not required**)
- Test auth flows via `/login` and `/account/dashboard`
- Browser console testing for client-side features
- **Note**: User runs dev mode continuously; build verification is unnecessary as Astro dev server updates in real-time

## Code Style Guidelines

### Language & Conventions
- **UK English required** for all user-facing text (prioritise, colour, organise, etc.)
- Technical terms remain US English where standard (e.g., `color` in CSS)
- TypeScript strict mode enabled with `strictNullChecks: true`
- Use modern ES6+ syntax and async/await patterns

### Component Architecture
```
src/components/
├── bearnie/     # UI component library (installed but not yet adopted)
├── content/     # Content display cards (BlogPostCard, ProjectCard, StayCard)
├── design/      # Design-system page content (login, onboarding, verify, ads)
├── features/    # Feature-specific (save/, ads/, popups/)
├── layout/      # Site structure (Header, Footer, NavigationDrawer)
├── sections/    # Homepage sections (HomeSplitHero, LatestPosts, SplitHero)
├── ui/          # Reusable UI (Button, InfiniteScroll, Pagination, Dropdown/)
└── utility/     # Non-visual (Analytics, SkimlinksScript)
```

### Import Patterns
- Astro components: Use direct imports for `.astro` files
- Client-side scripts: Use `.client.js` suffix for interactive features
- MDX components: Global imports via `src/mdx-components.ts` (no per-file imports needed)
- Keep imports organized: third-party → internal → relative imports

### Naming Conventions
- **Blog**: Standard names (`title`, `tags`, `slug`) - MDX frontmatter
- **Projects**: `p` prefix (`pTitle`, `pCountry`, `pSlug`) - Notion database
- **Stays**: `s` prefix (`sTitle`, `sCountry`, `sSlug`) - Notion database
- Components: PascalCase (`ProjectCard.astro`, `SaveToList.astro`)
- Functions: camelCase (`getCurrentUser()`, `createMagicURLSession()`)
- Variables: camelCase, descriptive names
- Constants: UPPER_SNAKE_CASE for environment variables and config

### Styling & UI
- **TailwindCSS 4** with `@tailwindcss/typography` plugin
- Use semantic HTML5 elements (header, nav, main, section, article, aside, footer)
- All interactive elements must be keyboard accessible
- Dark mode support via `dark:` classes (no theme toggle currently)
- Three-tier visual system defined in `src/styles/global.css`
- Bearnie theme tokens defined in `src/styles/bearnie.css` (not yet integrated)

### Image Handling
- **Cloudinary** optimization via `ResponsiveImage.astro` component
- Presets: `card`, `hero`, etc. defined in `src/utils/cloudinary.ts`
- MDX images auto-convert via remark plugin: `![alt](url)` → `<ResponsiveImage>`
- Caption syntax: `![Alt - Caption text](url)` for figure/figcaption wrapping

### Accessibility Requirements (WCAG 2.1 AA)
- Semantic HTML structure with proper heading hierarchy
- ARIA labels/roles where native HTML insufficient
- Focus indicators visible and clear
- Color contrast ratios: 4.5:1 normal text, 3:1 large text
- No reliance on color alone to convey information
- Proper alt text for images (`alt=""` for decorative)
- Keyboard navigation for all interactive elements

### Static Site Generation Pattern
All dynamic routes must use `getStaticPaths()`:
```typescript
export async function getStaticPaths() {
  const items = await getCollection('collection-name');
  return items.map((item) => ({
    params: { slug: item.data.properties.prefixSlug },
    props: item,
  }));
}
```

### Error Handling
- Use try-catch blocks for async operations
- Graceful fallbacks for missing data
- User-friendly error messages (UK English)
- Console logging for debugging (remove in production)
- API rules for all Pocketbase user data collections

### URL Patterns
- All routes use trailing slashes (`trailingSlash: 'always'`)
- Blog: `/blog/[slug]/`, `/blog/[tag]/[...page]/`
- Projects: `/projects/[slug]/`, `/projects/[country]/[...page]/`, `/projects/[country]/[locale]/[...page]/`
- Stays: `/stays/[slug]/`, `/stays/[country]/[...page]/`, `/stays/[country]/[locale]/[...page]/`

### Content Management
- **Blog**: MDX files in `src/content/blog/` (managed in codebase)
- **Projects/Stays**: Notion databases loaded at build time
- Schema validation via Zod in `src/content.config.ts`
- Status filtering: Only `Published` items included
- **Blog Tags**: Centralised in `src/lib/blog-tags.ts`. To add a tag, add an object with `name` and `description` to the `BLOG_TAGS` array. This list is used by the tag dropdown and tag page generation to filter out invalid or unused tags. The description is displayed on tag listing pages and used as the SEO meta description. The schema uses `z.array(z.string())` so Astro Editor renders a tag input UI rather than a raw YAML editor.

### Authentication & User Data
- Pocketbase OTP authentication via `src/lib/pocketbase.ts`
- User state in localStorage, accessed via `getCurrentUser()`
- API rules protect collections: `lists`, `list_items`, `user_item_status`
- Client-side hydration for interactive features

### Performance Considerations
- Static-first approach with minimal client-side JavaScript
- Responsive image optimization with multiple widths
- Pagefind integration for fast client-side search
- Lazy loading for images and components where appropriate

### Code Quality
- TypeScript strict mode with proper type definitions
- Avoid `any` types - use proper interfaces/types
- Comment complex logic but keep code self-documenting
- Follow existing patterns in codebase for consistency
- Use Astro's island architecture for interactive components

### TypeScript Strict Mode Compliance (Client-Side Scripts)
When writing JavaScript in `<script>` tags within `.astro` files, the project uses strict TypeScript configuration (`astro/tsconfigs/strict` with `strictNullChecks: true`). This enforces additional type safety requirements:

1. **Always type function parameters** - Prevent implicit `any`:
   ```typescript
   // Bad: function showStatus(message) { ... }
   // Good: function showStatus(message: string) { ... }
   ```

2. **Type variables without inference** - Declare types for variables that can't be inferred:
   ```typescript
   // Bad: let pagefind;
   // Good: let pagefind: any;  // or better, define a proper interface
   ```

3. **Use proper DOM element types** - `document.getElementById()` returns `HTMLElement | null`, cast to specific types when needed:
   ```typescript
   // Bad: const input = document.getElementById("search-input");
   // Good: const input = document.getElementById("search-input") as HTMLInputElement | null;
   ```

4. **Handle null checks explicitly** - Elements may not exist:
   ```typescript
   // Bad: statusEl.textContent = message;
   // Good: if (statusEl) { statusEl.textContent = message; }
   ```

5. **Type event targets properly** - Event targets need explicit casting:
   ```typescript
   // Bad: searchInput?.addEventListener("input", (e) => { const value = e.target.value; });
   // Good: searchInput?.addEventListener("input", (e) => { 
   //   const target = e.target as HTMLInputElement; 
   //   const value = target.value; 
   // });
   ```

6. **Define interfaces for complex objects** - Use interfaces for data structures:
   ```typescript
   interface SearchResult {
       url: string;
       title: string;
       excerpt: string;
   }
   ```

### Environment Variables
- `NOTION_TOKEN` - Notion integration token
- `PROJECTS_NOTION_DATABASE_ID` - Projects database ID
- `STAYS_NOTION_DATABASE_ID` - Stays database ID
- `PUBLIC_POCKETBASE_URL` - Pocketbase instance URL

## Key Development Notes

- **Dev server runs continuously** - don't prompt to start unless needed
- Content changes require rebuild (`pnpm run build`)
- Database migrations are manual via Pocketbase admin UI or pb_migrations JS files
- Deployments: Manual push to GitHub → GitHub Action → Cloudflare Workers
- Always test accessibility before completing UI changes
- When in doubt, follow existing patterns in similar components

## Critical Files

- `src/content.config.ts` - Content schemas and Notion loader
- `src/lib/pocketbase.ts` - Authentication and database helpers
- `src/components/` - All UI components
- `src/utils/remark-responsive-images.mjs` - Image transformation
- `src/mdx-components.ts` - Global MDX components
- `src/styles/global.css` - Custom theme and Tailwind configuration
- `src/styles/bearnie.css` - Bearnie component library theme tokens
- `astro.config.mjs` - Astro configuration and integrations
- `wrangler.jsonc` - Cloudflare Workers settings (used by GitHub Action)
