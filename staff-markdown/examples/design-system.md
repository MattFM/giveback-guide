> **Internal Documentation** | Interactive Examples
> 
> **Page:** Design System Showcase  
> **File:** `src/pages/staff/examples/design-system.astro`  
> **Type:** Interactive Component Page

# Design System Page - Summary

## Overview

This is a **live, interactive page** showcasing all UI components and design tokens. It displays colors, typography, spacing, and components in a working, visual format.

---

## What's Documented

### Design Tokens (Proposed October 2025)

**Primary Colors - Tropical Indigo:**
- `--color-primary`: #A98FFA
- `--color-primary-light`: #C4B3FC  
- `--color-primary-lighter`: #DED5FD
- `--color-primary-dark`: #8E6EF7
- `--color-primary-darker`: #7353D4

**Neutral Colors - Seasalt:**
- `--color-neutral-50`: #FFFFFF
- `--color-neutral-100`: #F6F7F6
- `--color-neutral-200`: #E8EAE8
- `--color-neutral-300`: #D1D4D1
- `--color-neutral-400`: #A8ACA8
- `--color-neutral-500`: #7E827E

**Dark Colors - Raisin Black:**
- `--color-dark`: #1C2434
- `--color-dark-light`: #2D3749
- `--color-dark-lighter`: #424D62
- `--color-dark-darker`: #151B27
- `--color-dark-darkest`: #0F1419

**Custom Brand Colors:**
- `--color-gbgblue`: #295483
- `--color-gbgpink`: #f1e8fb
- `--color-gbgyellow`: #ffe8b5
- `--color-gbgteal`: #b7e5e5

### Typography Scale

| Token | Value |
|-------|-------|
| `--font-size-xs` | 0.75rem (12px) |
| `--font-size-sm` | 0.875rem (14px) |
| `--font-size-base` | 1rem (16px) |
| `--font-size-lg` | 1.125rem (18px) |
| `--font-size-xl` | 1.25rem (20px) |
| `--font-size-2xl` | 1.5rem (24px) |
| `--font-size-3xl` | 1.875rem (30px) |
| `--font-size-4xl` | 2.25rem (36px) |

### Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-xs` | 0.5rem (8px) |
| `--spacing-sm` | 0.75rem (12px) |
| `--spacing-md` | 1rem (16px) |
| `--spacing-lg` | 1.5rem (24px) |
| `--spacing-xl` | 2rem (32px) |
| `--spacing-2xl` | 3rem (48px) |
| `--spacing-3xl` | 4rem (64px) |
| `--spacing-4xl` | 6rem (96px) |

### Components Shown

- **Buttons** - Primary, secondary, outline variants
- **Form inputs** - Text, select, checkboxes
- **Cards** - Various card layouts
- **Color swatches** - All color tokens with hex values
- **Typography samples** - All font sizes displayed

---

## How to View

**This is an interactive page, not a document.**

To see the actual design system:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:4321/staff/examples/design-system
   ```

3. View in browser to see:
   - Live color swatches
   - Working buttons with hover states
   - Interactive components
   - Copy-to-clipboard functionality

---

## Technical Details

| Property | Value |
|----------|-------|
| **Framework** | Astro |
| **Styling** | CSS custom properties + Tailwind |
| **Header** | Transparent on dark gradient |
| **Components** | Button.astro, Hero.astro |
| **Features** | Live previews, hover states, copy values |

---

## File Location

```
src/pages/staff/examples/design-system.astro
```

---

## Note

This markdown file is a **summary only**. The actual design system page is an interactive Astro component that must be viewed in a browser with the dev server running to see all colors, components, and interactive features.
