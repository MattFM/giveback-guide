# AGENTS.md - Development Guidelines for AI Coding Agents

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start Astro dev server (runs continuously)
npm run build            # Build for production (uses --no-deprecation flag)

# Content Management
npm run blog:convert     # Convert Notion to MDX (utility script)
npm run blog:validate    # Validate MDX blog posts
npm run astro            # Direct Astro CLI access
```

**Testing**: No formal test suite. Use manual testing:
- `npm run dev` for development testing
- `npm run build` for production build validation
- Test auth flows via `/login` and `/account/dashboard`
- Browser console testing for client-side features

## Code Style Guidelines

### Language & Conventions
- **UK English required** for all user-facing text (prioritise, colour, organise, etc.)
- Technical terms remain US English where standard (e.g., `color` in CSS)
- TypeScript strict mode enabled with `strictNullChecks: true`
- Use modern ES6+ syntax and async/await patterns

### Component Architecture
```
src/components/
├── content/     # Content display cards (BlogPostCard, ProjectCard, StayCard)
├── features/    # Feature-specific (save/, ads/, popups/)
├── layout/      # Site structure (Header, Footer, NavigationDrawer)
├── sections/    # Homepage sections (HomeHero, LatestPosts)
├── ui/          # Reusable UI (Button, InfiniteScroll, Pagination, Dropdown/)
└── utility/     # Non-visual (Analytics, TestListsClient)
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
- RLS (Row Level Security) policies for all Supabase user data

### URL Patterns
- All routes use trailing slashes (`trailingSlash: 'always'`)
- Blog: `/blog/[slug]/`, `/blog/[tag]/[page]/`
- Projects: `/projects/[slug]/`, `/projects/[country]/[page]/`
- Stays: `/stays/[slug]/`, `/stays/[country]/[page]/`

### Content Management
- **Blog**: MDX files in `src/content/blog/` (managed in codebase)
- **Projects/Stays**: Notion databases loaded at build time
- Schema validation via Zod in `src/content.config.ts`
- Status filtering: Only `Published` items included

### Authentication & User Data
- Supabase magic link authentication via `src/lib/supabase.ts`
- User state in localStorage, accessed via `getCurrentUser()`
- RLS-protected tables: `lists`, `list_items`, `user_item_status`
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

### Environment Variables
- `NOTION_TOKEN` - Notion integration token
- `PROJECTS_NOTION_DATABASE_ID` - Projects database ID
- `STAYS_NOTION_DATABASE_ID` - Stays database ID
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON` - Supabase anonymous key

## Key Development Notes

- **Dev server runs continuously** - don't prompt to start unless needed
- Content changes require rebuild (`npm run build`)
- Database migrations are manual via Supabase dashboard
- Deployments: Manual VSCode plugin trigger → GitHub Action → Cloudflare Workers
- Trust code over `/docs` directory for current implementation
- Always test accessibility before completing UI changes
- When in doubt, follow existing patterns in similar components

## Critical Files

- `src/content.config.ts` - Content schemas and Notion loader
- `src/lib/supabase.ts` - Authentication and database helpers
- `src/components/` - All UI components
- `src/utils/remark-responsive-images.mjs` - Image transformation
- `src/mdx-components.ts` - Global MDX components
- `astro.config.mjs` - Astro configuration and integrations
- `wrangler.jsonc` - Cloudflare Workers settings (used by GitHub Action)
- `migrations/` - Database schema changes (reference only)