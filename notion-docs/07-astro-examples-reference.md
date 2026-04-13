# Astro Interactive Examples - Reference Summary

> **Internal Documentation** | Design System Examples
> **Note:** These are interactive Astro components, not documents. Key information extracted below.

---

## 1. Design System Page (`/docs/examples/design-system`)

**Purpose:** Live reference for UI components and design tokens

### Design System Tokens Documented

**Colour Palette (Proposed October 2025):**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #A98FFA | Tropical Indigo - Primary accent |
| `--color-primary-light` | #C4B3FC | Hover states |
| `--color-neutral-50` | #FFFFFF | White backgrounds |
| `--color-neutral-100` | #F6F7F6 | Light gray backgrounds |
| `--color-dark` | #1C2434 | Navy - Dark text |
| `--color-gbgblue` | #295483 | Brand blue |
| `--color-gbgpink` | #f1e8fb | Brand pink |

**Typography Scale:**

| Token | Value |
|-------|-------|
| `--font-size-xs` | 0.75rem |
| `--font-size-sm` | 0.875rem |
| `--font-size-base` | 1rem |
| `--font-size-lg` | 1.125rem |
| `--font-size-2xl` | 1.5rem |
| `--font-size-4xl` | 2.25rem |

**Spacing Scale:**

| Token | Value |
|-------|-------|
| `--spacing-xs` | 0.5rem |
| `--spacing-sm` | 0.75rem |
| `--spacing-md` | 1rem |
| `--spacing-lg` | 1.5rem |
| `--spacing-xl` | 2rem |
| `--spacing-4xl` | 6rem |

**Components Showcased:**
- Buttons (primary, secondary, outline)
- Form inputs
- Cards
- Colour swatches
- Typography samples

---

## 2. Hero Examples Page (`/docs/examples/hero-examples`)

**Purpose:** Demonstrates different Hero component configurations

### Hero Variations Shown

**1. Solid Color Background**
```astro
<Hero 
  title="Explore Thailand"
  description="Discover sustainable projects"
  background="color"
  backgroundValue="var(--color-brand-600)"
  theme="dark"
  size="large"
/>
```

**2. Image Background**
```astro
<Hero 
  title="Make a Difference"
  description="Join our community"
  background="image"
  backgroundValue="/images/hero-bg.jpg"
  theme="dark"
/>
```

**3. Gradient Background**
```astro
<Hero 
  title="Get Started"
  description="Your journey begins here"
  background="gradient"
  backgroundValue="linear-gradient(135deg, #9333ea, #4a5e4a)"
  theme="dark"
  size="medium"
  align="center"
/>
```

**4. Light Theme**
```astro
<Hero 
  title="About Us"
  description="Learn our story"
  background="color"
  backgroundValue="var(--color-neutral-50)"
  theme="light"
/>
```

### Key Props Reference

| Prop | Options | Default |
|------|---------|---------|
| `background` | 'color' \| 'image' \| 'gradient' | 'color' |
| `theme` | 'light' \| 'dark' | 'dark' |
| `size` | 'small' \| 'medium' \| 'large' | 'medium' |
| `align` | 'left' \| 'center' | 'left' |

### Interactive Features Demonstrated
- Header transparency transition (scroll down to see header go from transparent to solid)
- Theme colour changes (dark vs light)
- Different hero sizes (small/medium/large)
- Alignment variations (left vs center)

---

## File Locations

| Page | File Path |
|------|-----------|
| Design System | `src/pages/docs/examples/design-system.astro` |
| Hero Examples | `src/pages/docs/examples/hero-examples.astro` |

---

## Notes

- These pages require the dev server (`npm run dev`) to view interactively
- The design system page shows all current colour tokens and spacing values
- Hero examples page demonstrates the transparent header system in action
- Both pages use the integrated header system (transparent header on dark backgrounds)
