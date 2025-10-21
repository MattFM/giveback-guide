# Internal Documentation

This directory contains internal documentation and example pages that are **not publicly indexed**.

## Structure

```
/docs/
├── components/          # Component-specific documentation
│   └── navigation-drawer.md
├── features/            # Feature implementation docs
│   ├── integrated-header-guide.md
│   ├── integrated-header-implementation.md
│   └── integrated-header-fixes.md
├── guides/              # General guides and references
│   ├── design-guidelines.md
│   ├── component-migration-plan.md
│   ├── import-update-reference.md
│   ├── migration-complete.md
│   └── responsive-images.md
└── user-research/       # User research and design decisions
    ├── layout-design-survey.md
    ├── project-stay-layout-decisions.md
    └── page-layout-mockup.md
```

## Demo Pages

Demo pages are located in `/src/pages/docs/examples/`:
- **Design System** (`/docs/examples/design-system/`)
- **Hero Examples** (`/docs/examples/hero-examples/`)

View all at: `/docs/`

## SEO Protection

This section is protected from public indexing:

1. **robots.txt**: Blocks `/docs/` path
2. **Sitemap**: Filters out all `/docs/` URLs
3. **No public links**: Not linked from main navigation

## Usage

Access documentation directly via URL:
- Browse: `https://giveback.guide/docs/`
- Examples: `https://giveback.guide/docs/examples/design-system/`
- Markdown: Read files directly from `/docs/` directory

## Adding New Documentation

### Markdown Files
Place in appropriate subdirectory:
- Component docs → `/docs/components/`
- Feature docs → `/docs/features/`
- Guides → `/docs/guides/`
- User research → `/docs/user-research/`

### Demo Pages
Place Astro files in:
- `/src/pages/docs/examples/`

Pages will automatically be:
- ✅ Accessible via direct URL
- ✅ Hidden from robots
- ✅ Excluded from sitemap
- ✅ Listed on `/docs/` index

---

## User Research & Design

### Project & Stay Page Redesign (October 2025)

A comprehensive review and redesign of the Project and Stay page layouts to improve visual hierarchy, user flow, and conversion rates.

**Key Documents:**

- **[Layout Design Survey](./user-research/layout-design-survey.md)** - User research questions to validate design decisions
- **[Design Decisions](./user-research/project-stay-layout-decisions.md)** - Full rationale, three-tier visual system, and unified action bar approach
- **[Page Layout Mock-up](./user-research/page-layout-mockup.md)** - Visual representation using real Furahaa project data

**Key Proposals:**
- Three-tier visual system (Action, Emphasis, Flow)
- Unified expandable action bar across all page types
- Impact Areas elevated to position 4 (after title)
- Color-coded impact area cards
- Clickable metadata pills for filtering
- Improved verification section with testimonials
- Mobile-optimized action access
