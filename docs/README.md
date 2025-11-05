# Internal Documentation

This directory contains internal documentation and example pages that are **not publicly indexed**.

## Structure

```
/docs/
├── how-tos/             # Implementation guides and how-to documentation
│   ├── integrated-header.mdx
│   ├── navigation-drawer.mdx
│   └── responsive-images.mdx
├── examples/            # Live interactive demonstrations
│   ├── design-system.astro
│   └── hero-examples.astro
└── research/            # User research and feedback collection
    └── layout-design-survey.mdx
```

## Categories

### How-To Guides (`/docs/how-tos/`)
Implementation guides for features and components. Technical documentation for developers.

### Examples (`/docs/examples/`)
Live interactive demonstrations and visual references.

### Research (`/docs/research/`)
User research surveys and feedback collection tools for ongoing site improvements.

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

## Research

Ongoing user research and feedback collection to improve the Giveback Guide experience.

**Active Surveys:**

- **User Experience Survey** - Continuous feedback collection about site features, usability, and user preferences
