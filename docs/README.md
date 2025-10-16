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
└── guides/              # General guides and references
    ├── design-guidelines.md
    ├── component-migration-plan.md
    ├── import-update-reference.md
    ├── migration-complete.md
    └── responsive-images.md
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

### Demo Pages
Place Astro files in:
- `/src/pages/docs/examples/`

Pages will automatically be:
- ✅ Accessible via direct URL
- ✅ Hidden from robots
- ✅ Excluded from sitemap
- ✅ Listed on `/docs/` index
