# Giveback Guide Design System Guidelines

**Version:** 1.0  
**Last Updated:** October 2025  
**Design Philosophy:** Natural Bridge - Sophisticated neutrals with purposeful color accents

---

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Interactive States](#interactive-states)
6. [Content Types](#content-types)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)

---

## Color System

### The Natural Bridge Approach
Our color system is built on **sophisticated neutrals (80% usage)** with **purposeful accent colors (20% usage)**. This creates a calm, professional foundation that lets content and impact stories shine.

### Color Families & Usage

#### **Neutrals (Primary Palette - 80% of design)**
Use neutrals for the majority of your design to create a calm, professional foundation.

```css
--color-neutral-50: #fafafa;   /* Subtle backgrounds, alternating sections */
--color-neutral-100: #f5f5f5;  /* Card backgrounds, input fields */
--color-neutral-200: #e5e5e5;  /* Borders, dividers */
--color-neutral-300: #d4d4d4;  /* Disabled states, subtle borders */
--color-neutral-400: #a3a3a3;  /* Placeholder text, icons */
--color-neutral-500: #737373;  /* Secondary text, captions */
--color-neutral-600: #525252;  /* Body text (standard) */
--color-neutral-700: #404040;  /* Emphasized text */
--color-neutral-800: #262626;  /* Dark text, headings */
--color-neutral-900: #171717;  /* Primary headings */
--color-neutral-950: #0a0a0a;  /* Hero text, maximum contrast */
```

**When to use:**
- **Backgrounds:** White or neutral-50 for main content, neutral-100 for cards
- **Text:** neutral-950 for hero/h1, neutral-900 for h2-h3, neutral-700 for h4-h6, neutral-600 for body
- **Borders:** neutral-200 for subtle, neutral-300 for defined
- **UI Elements:** neutral-400+ for icons and secondary elements

#### **Brand Purple (Heritage Color - Strategic Use)**
Reserved for primary actions, brand identity, and key interactive elements.

```css
--color-brand-600: #9333ea;  /* Primary CTAs, links, active states */
--color-brand-700: #7c2d12;  /* Hover states for primary CTAs */
```

**When to use:**
- Primary CTA buttons ("Book Now", "Get Started", "Browse Projects")
- Active navigation items
- Selected/focused states
- Brand logos and key identifiers
- Links in body text
- Loading spinners and progress indicators

**When NOT to use:**
- Background for large sections (too overwhelming)
- Body text (readability issues)
- Multiple elements on same screen (dilutes impact)

#### **Sage Green (Nature & Conservation)**
Associated with environmental impact, wildlife, nature-based projects.

```css
--color-sage-600: #4a5e4a;  /* Success states, nature content */
--color-sage-100: #e3e8e3;  /* Nature-themed backgrounds */
```

**When to use:**
- Wildlife and conservation project badges
- Success messages and confirmations
- Nature/eco-lodge category identifiers
- Secondary CTAs for environmental actions
- Progress indicators for conservation goals

#### **Terracotta (Community & Culture)**
Associated with community, cultural projects, warmth, human connection.

```css
--color-terracotta-600: #c2410c;  /* Cultural content, community focus */
--color-terracotta-100: #fed7aa;  /* Warm backgrounds */
```

**When to use:**
- Community and cultural project badges
- Warning/attention messages (non-critical)
- Cultural experience category identifiers
- Highlighting local/indigenous content
- Warm welcome sections

#### **Red (Destructive Actions & Errors)**
Reserved exclusively for destructive actions, errors, and critical warnings.

```css
--color-red-50: #fef2f2;
--color-red-100: #fee2e2;
--color-red-200: #fecaca;
--color-red-600: #dc2626;  /* Delete buttons, error states */
--color-red-700: #b91c1c;  /* Hover states for destructive actions */
--color-red-800: #991b1b;  /* Error text */
```

**When to use:**
- Delete/remove buttons
- Error messages and validation failures
- Critical warnings that require immediate attention
- Form field error states
- Destructive confirmation dialogs

**When NOT to use:**
- Regular warnings (use terracotta)
- General attention-getting (use brand purple)
- Decorative purposes

### Color Rules & Hierarchy

**Rule 1: The 60-30-10 Principle**
- 60% Neutral (backgrounds, text, structure)
- 30% White space
- 10% Accent colors (brand purple, sage, terracotta)

**Rule 2: One Accent Per Section**
Avoid mixing multiple accent colors in the same section. Choose one accent that matches the content theme.

**Rule 3: Text Contrast**
- Always use neutral-950 or neutral-900 on light backgrounds
- Always use white or neutral-50 on dark backgrounds
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text

**Rule 4: Background Hierarchy**
```
Level 1 (Base):        White or neutral-50
Level 2 (Cards):       White on neutral-50 backgrounds, neutral-50 on white backgrounds
Level 3 (Highlights):  Accent-50 colors for themed sections
```

---

## Typography

### Type Scale & Usage

Our type scale follows a modular approach based on a 1.25x ratio for clear hierarchy.

```css
--font-size-xs:    0.75rem;   /* 12px - Captions, fine print */
--font-size-sm:    0.875rem;  /* 14px - Small text, labels, metadata */
--font-size-base:  1rem;      /* 16px - Body text (primary) */
--font-size-lg:    1.125rem;  /* 18px - Emphasized paragraphs, card titles */
--font-size-xl:    1.25rem;   /* 20px - Card headings, subheadings */
--font-size-2xl:   1.5rem;    /* 24px - Section subheadings */
--font-size-3xl:   1.875rem;  /* 30px - Section headings */
--font-size-4xl:   2.25rem;   /* 36px - Page titles, hero headings */
--font-size-5xl:   3rem;      /* 48px - Major hero text only */
```

### Standard Type Treatments

#### **Hero Sections**
```css
h1 {
  font-size: var(--font-size-4xl);      /* or 5xl for landing pages */
  font-weight: 800;
  line-height: 1.1;
  color: var(--color-neutral-950);
  margin-bottom: var(--spacing-lg);
}
```

#### **Section Headings**
```css
h2 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-neutral-950);
  margin-bottom: var(--spacing-xl);
}
```

#### **Subsection Headings**
```css
h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-neutral-900);
  margin-bottom: var(--spacing-md);
}
```

#### **Body Text**
```css
p {
  font-size: var(--font-size-base);
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-neutral-600);
  margin-bottom: var(--spacing-md);
}
```

#### **Small Text & Captions**
```css
.caption, .metadata {
  font-size: var(--font-size-sm);
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-neutral-500);
}
```

### Font Weight Guidelines

- **400 (Normal):** Body text, paragraphs, descriptions
- **500 (Medium):** Labels, tabs, secondary navigation
- **600 (Semibold):** Buttons, badges, emphasized text, strong statements
- **700 (Bold):** All headings (h2-h5), card titles, section labels
- **800 (Extrabold):** Hero text (h1), major callouts only

### Line Height Standards

- **1.1-1.2:** Large headings (h1, h2) - tighter for visual impact
- **1.3-1.4:** Medium headings (h3, h4) - balanced
- **1.6:** Body text - optimal readability
- **1.5:** Small text and captions - comfortable reading

### Text Formatting Rules

**Rule 1: Use `text-balance` for Headings**
Add `text-wrap: balance` to headings to prevent awkward orphans.

**Rule 2: Paragraph Width**
Body text should never exceed 75 characters per line (approximately 720px max-width).

**Rule 3: Letter Spacing**
- Normal for body text and headings
- Slight increase (0.05em) for uppercase labels and buttons
- Never use letter-spacing on large headings (looks amateurish)

---

## Spacing & Layout

### Spacing Scale

Our spacing system uses a consistent 4px base unit, scaling exponentially for larger gaps.

```css
--spacing-xs:   0.25rem;  /* 4px  - Micro gaps, tight spacing */
--spacing-sm:   0.5rem;   /* 8px  - Small gaps, badge padding */
--spacing-md:   0.75rem;  /* 12px - Standard gaps between elements */
--spacing-lg:   1rem;     /* 16px - Card padding, comfortable gaps */
--spacing-xl:   1.5rem;   /* 24px - Section internal spacing */
--spacing-2xl:  2rem;     /* 32px - Spacious card padding */
--spacing-3xl:  3rem;     /* 48px - Section spacing */
--spacing-4xl:  4rem;     /* 64px - Large section padding */
--spacing-5xl:  6rem;     /* 96px - Major section separation */
```

### Spacing Rules

**Rule 1: Section Vertical Rhythm**
```css
/* Desktop */
section { padding: var(--spacing-4xl) var(--spacing-lg); }

/* Between sections */
section + section { margin-top: var(--spacing-5xl); }
```

**Rule 2: Card & Component Spacing**
```css
/* Standard card */
.card { padding: var(--spacing-xl); }

/* Compact card */
.card-compact { padding: var(--spacing-lg); }

/* Spacious card */
.card-spacious { padding: var(--spacing-2xl); }
```

**Rule 3: Element Relationships**
- **Very related** (label → input): `--spacing-xs` (4px)
- **Related** (paragraphs): `--spacing-md` (12px)
- **Grouped** (card content sections): `--spacing-lg` (16px)
- **Separated** (distinct content blocks): `--spacing-xl` (24px)

**Rule 4: Responsive Spacing**
On mobile (<768px), reduce large spacing by 50%:
```css
@media (max-width: 767px) {
  section { padding: var(--spacing-2xl) var(--spacing-lg); }
}
```

### Container Widths

Different content types require different maximum widths for optimal readability.

```css
/* Full width - Heroes, images, data tables */
.container-full {
  max-width: 100%;
  padding: 0 var(--spacing-lg);
}

/* Standard - Most pages, mixed content */
.container {
  max-width: 1200px;  /* 75rem */
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Narrow - Blog posts, text-heavy content */
.container-narrow {
  max-width: 720px;   /* 45rem */
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Wide - Data-rich pages, dashboards */
.container-wide {
  max-width: 1440px;  /* 90rem */
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}
```

### Grid Systems

**Standard 12-Column Grid**
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-xl);
}
```

**Auto-Fit Cards (Responsive)**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}
```

**Bento Grid (Modern Layouts)**
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}
```

---

## Components

### Buttons

We use a reusable `Button.astro` component located at `src/components/ui/Button.astro`.

#### **Button Component Props**

```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
  href?: string;  // Renders as <a> tag if provided
  class?: string; // Additional Tailwind classes
}
```

#### **Button Variants**

**Primary Button** - Main actions (black background)
```astro
<Button variant="primary">Primary Action</Button>
```
- Background: Black (`bg-black`)
- Text: White
- Use for: Primary CTAs, main actions, "Book Now", "Get Started"

**Secondary Button** - Alternative actions
```astro
<Button variant="secondary">Secondary Action</Button>
```
- Background: Gray 600
- Text: White
- Use for: Alternative CTAs, supporting actions

**Outline Button** - Tertiary actions
```astro
<Button variant="outline">Tertiary Action</Button>
```
- Background: Transparent
- Border: Black 1px
- Text: Black
- Use for: Low-emphasis actions, "Learn More", cancel buttons

**Ghost Button** - Minimal UI
```astro
<Button variant="ghost">Ghost Action</Button>
```
- Background: Transparent (gray on hover)
- Text: Gray 700
- Use for: Navigation items, subtle actions, icon buttons

**Danger Button** - Destructive actions
```astro
<Button variant="danger">Delete</Button>
```
- Background: Red 600
- Text: White
- Use for: Delete, remove, destructive operations only

#### **Button Sizes**

```astro
<Button size="sm">Small Button</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large Button</Button>
```

- **Small:** `px-3 py-1.5 text-sm` - Compact UI, inline actions
- **Medium (default):** `px-4 py-2 text-base` - Standard buttons
- **Large:** `px-6 py-3 text-lg` - Hero CTAs, emphasis

#### **Additional Options**

**Full Width**
```astro
<Button fullWidth>Full Width Button</Button>
```

**As Link**
```astro
<Button href="/donate" variant="primary">Donate Now</Button>
```
Automatically renders as `<a>` tag when `href` is provided.

**Disabled State**
```astro
<Button disabled>Disabled Button</Button>
```

**Custom Classes**
```astro
<Button class="shadow-lg mt-4">Custom Styled</Button>
```

#### **Button Hierarchy Rules**

**Rule 1: One Primary Per Section**
Only one primary button should be visible in any given screen area to avoid decision paralysis.

**Rule 2: Button Order**
In multi-button layouts: `[Primary] [Secondary] [Outline]` - Order by importance left to right.

**Rule 3: Consistent Sizing**
Use the same size for buttons in the same context. Don't mix small and large buttons in a button group.

### Cards

#### **Base Card Style**
```css
.card {
  background: white;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-neutral-200);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

#### **Card Variants**

**Standard Project Card**
- Image (16:9 or square aspect ratio)
- Content padding: `var(--spacing-xl)`
- Title: `--font-size-xl`, `font-weight: 700`
- Description: `--font-size-base`
- Metadata: `--font-size-sm`, `color: neutral-600`

**Compact Card**
- Reduced padding: `var(--spacing-lg)`
- Smaller image (4:3 aspect)
- Title: `--font-size-lg`
- Minimal metadata

**Featured Card**
- Larger size (can span 2 columns)
- Gradient background or accent border
- Enhanced shadow on hover

### Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;  /* Fully rounded */
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Impact Badges** - Map to content themes:
- **Wildlife/Nature:** `background: sage-100; color: sage-800`
- **Community/Culture:** `background: terracotta-100; color: terracotta-800`
- **General/Neutral:** `background: neutral-100; color: neutral-700`

---

## Interactive States

### Standard Transitions

All interactive elements should use smooth transitions:
```css
transition: all 0.2s ease;
```

### Hover States

**Cards & Clickable Areas**
```css
:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Buttons**
```css
:hover {
  transform: translateY(-1px);
  /* Color change + shadow */
}
```

**Links**
```css
a {
  color: var(--color-brand-600);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-brand-700);
  text-decoration: underline;
}
```

### Focus States

All interactive elements must have visible focus states for accessibility:
```css
:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
  border-color: var(--color-brand-600);
}
```

### Loading States

**Skeleton Loading**
```css
.skeleton {
  background: var(--color-neutral-200);
  border-radius: var(--border-radius-md);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Spinner**
```css
.spinner {
  border: 2px solid var(--color-neutral-200);
  border-top: 2px solid var(--color-brand-600);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}
```

---

## Content Types

### Project Cards

**Required Elements:**
- Feature image (aspect ratio 16:9 or 1:1)
- Location with icon
- Title (--font-size-xl, bold)
- Short description (2 lines max)
- 1-2 impact badges
- Primary CTA button

**Optional Elements:**
- Price/cost indicator
- Save/favorite button
- Rating or verification badge

### Blog Cards

**Required Elements:**
- Feature image (16:9)
- Category badge
- Title (--font-size-lg, bold)
- Excerpt (3 lines max)
- Published date
- Read time estimate

### Stay Cards

**Required Elements:**
- Feature image with price overlay
- Location
- Title
- Nightly rate
- Impact area badge(s)
- Book/View button

---

## Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
/* Base styles: Mobile (<768px) */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }
```

### Responsive Grid Patterns

**Mobile:** 1 column  
**Tablet:** 2 columns  
**Desktop:** 3-4 columns

```css
.card-grid {
  grid-template-columns: 1fr;  /* Mobile */
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);  /* Tablet */
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);  /* Desktop */
  }
}
```

### Typography Scaling

On mobile, reduce heading sizes by 20-30%:
```css
/* Mobile */
h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }

/* Desktop */
@media (min-width: 1024px) {
  h1 { font-size: var(--font-size-4xl); }
  h2 { font-size: var(--font-size-3xl); }
}
```

---

## Accessibility

### Color Contrast

- **Body text:** Minimum 4.5:1 contrast ratio
- **Large text (18px+):** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 against background

### Focus Indicators

Never remove focus outlines without providing an alternative:
```css
:focus {
  outline: none;  /* Only if replaced with visible alternative */
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}
```

### Touch Targets

Minimum size: 44x44px for all interactive elements on mobile.

### Alt Text

All images must have descriptive alt text:
```html
<img src="project.jpg" alt="Community members at café in Thailand" />
```

---

## Quick Reference: Common Patterns

### Section Padding
```css
section { padding: var(--spacing-4xl) var(--spacing-lg); }
```

### Card Spacing
```css
.card { padding: var(--spacing-xl); gap: var(--spacing-lg); }
```

### Heading Margins
```css
h2 { margin-bottom: var(--spacing-xl); }
h3 { margin-bottom: var(--spacing-md); }
```

### Button Gaps
```css
.button-group { gap: var(--spacing-sm); }
```

### Grid Gaps
```css
.grid { gap: var(--spacing-xl); }  /* Standard */
.grid-compact { gap: var(--spacing-lg); }  /* Compact */
```

---

## Images & Media

### Standard Image Dimensions

All images should be optimized and delivered at standardized dimensions for consistency and performance.

**Standard Content Images**
```
1200 x 800 pixels (3:2 aspect ratio)
```

**Use for:**
- Project card images
- Blog post featured images
- Stay card images
- Gallery images
- Standard content imagery

**Hero Images**
```
1920 x 1080 pixels (16:9 aspect ratio)
```

**Use for:**
- Homepage hero sections
- Landing page headers
- Full-width promotional banners
- Video thumbnails

### Image Optimization Rules

**Rule 1: Always Provide Alt Text**
Descriptive alt text is required for all images.
```html
<img src="project.jpg" alt="Local artisan teaching traditional weaving in Guatemala" />
```

**Rule 2: Responsive Images**
Use srcset for different screen sizes:
```html
<img 
  src="image-1200.jpg" 
  srcset="image-600.jpg 600w, image-1200.jpg 1200w, image-1920.jpg 1920w"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
  alt="Description"
/>
```

**Rule 3: Lazy Loading**
Implement lazy loading for images below the fold:
```html
<img src="image.jpg" loading="lazy" alt="Description" />
```

**Rule 4: WebP Format**
Prefer WebP format for better compression with fallbacks:
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>
```

### Image Aspect Ratios in Components

**Project Cards:** 3:2 (1200x800 cropped if needed)  
**Blog Cards:** 3:2 (1200x800)  
**Stay Cards:** 3:2 (1200x800)  
**Hero Sections:** 16:9 (1920x1080)  
**Square Avatars:** 1:1 (400x400 recommended)

---

## Animation & Motion

### Animation Philosophy

**Minimal & Purposeful**

Given that most users access the site on mobile devices, animations should be minimal and serve a functional purpose. Excessive motion can:
- Drain battery life
- Cause performance issues
- Distract from content
- Trigger motion sensitivity

### Allowed Animations

**1. Hover States (Desktop Only)**
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}
```

**2. Focus States**
```css
:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
  transition: box-shadow 0.15s ease;
}
```

**3. Loading States**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**4. Button Interactions**
```css
.btn:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.btn:active {
  transform: translateY(0);
}
```

### Avoid

❌ Scroll-triggered animations  
❌ Parallax effects  
❌ Auto-playing animations  
❌ Elaborate entrance animations  
❌ Continuous animations (except loading spinners)  
❌ Animations longer than 0.3s

### Respect User Preferences

Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Forms & Input Elements

### Form Design Philosophy

All form elements should follow the clean, modern aesthetic established by the search bar design.

### Standard Input Fields

```css
input[type="text"],
input[type="email"],
input[type="password"],
input[type="url"],
input[type="tel"],
input[type="number"],
input[type="date"] {
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-base);
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--border-radius-lg);
  background: white;
  color: var(--color-neutral-900);
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
}

input::placeholder {
  color: var(--color-neutral-400);
}
```

### Text Areas

Same styling as inputs, with minimum height:
```css
textarea {
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  /* All other properties same as input */
}
```

### Select Dropdowns

```css
select {
  padding: var(--spacing-lg) var(--spacing-xl);
  padding-right: calc(var(--spacing-xl) * 2.5);
  font-size: var(--font-size-base);
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--border-radius-lg);
  background: white;
  background-image: url('data:image/svg+xml;...');
  background-repeat: no-repeat;
  background-position: right var(--spacing-lg) center;
  background-size: 16px;
  appearance: none;
  cursor: pointer;
}
```

### Checkboxes & Radio Buttons

Custom styled for consistency:
```css
input[type="checkbox"],
input[type="radio"] {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-neutral-300);
  border-radius: 4px; /* checkbox */
  border-radius: 50%; /* radio */
  appearance: none;
  cursor: pointer;
  position: relative;
}

input[type="checkbox"]:checked,
input[type="radio"]:checked {
  background: var(--color-brand-600);
  border-color: var(--color-brand-600);
}

input[type="checkbox"]:checked::after {
  content: '✓';
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
}
```

### Form Labels

```css
label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-neutral-700);
  margin-bottom: var(--spacing-xs);
}
```

### Error States

```css
input.error,
textarea.error,
select.error {
  border-color: var(--color-red-600);
}

input.error:focus {
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-red-700);
}
```

### Success States

```css
input.success {
  border-color: var(--color-sage-600);
}

input.success:focus {
  box-shadow: 0 0 0 3px rgba(74, 94, 74, 0.1);
}
```

### Required Field Indicators

```css
label.required::after {
  content: '*';
  color: var(--color-red-600);
  margin-left: var(--spacing-xs);
}
```

---

## Border Radius Standards

### Standardized Values

To maintain visual consistency, specific component types should always use designated border radius values.

```css
--border-radius-sm: 0.375rem;  /* 6px */
--border-radius-md: 0.75rem;   /* 12px */
--border-radius-lg: 1rem;      /* 16px */
--border-radius-xl: 1.5rem;    /* 24px */
--border-radius-2xl: 2rem;     /* 32px */
--border-radius-full: 9999px;  /* Fully rounded */
```

### Component-Specific Rules

| Component | Border Radius | Rationale |
|-----------|---------------|------------|
| **Buttons** | `--border-radius-md` (12px) | Comfortable click target, modern feel |
| **Input Fields** | `--border-radius-lg` (16px) | Matches button sizing, friendly appearance |
| **Cards** | `--border-radius-lg` (16px) | Standard card aesthetic |
| **Badges/Tags** | `--border-radius-full` | Pill shape for compact labels |
| **Modals** | `--border-radius-xl` (24px) | Softer edges for larger components |
| **Images** | `--border-radius-lg` (16px) | Subtle rounding without distraction |
| **Avatars** | `--border-radius-full` | Standard circular profile images |
| **Alerts** | `--border-radius-md` (12px) | Balanced with content density |
| **Code Blocks** | `--border-radius-sm` (6px) | Technical, precise appearance |
| **Dropdowns** | `--border-radius-md` (12px) | Matches input fields |

### Consistency Rule

**Never vary border radius within the same component family.** All buttons should use the same radius, all cards should match, etc.

---

## Icons

### Icon Library: Huge Icons

**Selected Library:** [Huge Icons](https://hugeicons.com/icons?style=Stroke&type=Rounded)  
**Style:** Stroke  
**Type:** Rounded

### Why Huge Icons?

- **Modern aesthetic:** Rounded stroke style aligns with our friendly, approachable brand
- **Comprehensive:** Large library covering all use cases
- **Consistency:** Uniform stroke weight and style
- **Quality:** Well-designed and professionally crafted

### Icon Sizing Standards

```css
/* Small - Inline text, badges */
.icon-sm {
  width: 16px;
  height: 16px;
  stroke-width: 1.5;
}

/* Medium - Buttons, cards, standard UI */
.icon-md {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
}

/* Large - Features, headers */
.icon-lg {
  width: 24px;
  height: 24px;
  stroke-width: 1.5;
}

/* Extra Large - Hero sections, empty states */
.icon-xl {
  width: 32px;
  height: 32px;
  stroke-width: 1.5;
}
```

### Icon Color Usage

**Default Icons:**
- Body context: `color: var(--color-neutral-500)`
- Active/Interactive: `color: var(--color-neutral-700)`
- Disabled: `color: var(--color-neutral-300)`

**Themed Icons:**
- Success/Nature: `color: var(--color-sage-600)`
- Warning: `color: var(--color-terracotta-600)`
- Error/Delete: `color: var(--color-red-600)`
- Brand/Primary: `color: var(--color-brand-600)`

### Icon Implementation

**SVG Inline (Preferred):**
```html
<svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="..."/>
</svg>
```

**With Text:**
```html
<button>
  <svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="..."/>
  </svg>
  <span>Button Text</span>
</button>
```

### Common Icon Usage

- **Location:** Map pin icon (sage green for nature projects)
- **Save/Favorite:** Heart icon (outline when inactive, filled when active)
- **Share:** Share nodes icon
- **Search:** Magnifying glass
- **Filter:** Funnel icon
- **Close:** X icon
- **Menu:** Hamburger (three lines)
- **User:** User circle
- **Calendar:** Calendar icon
- **Arrow:** Right arrow for navigation

---

## Questions for Refinement

The following areas have been finalized based on your input:

### ✅ 1. **Destructive Actions**
Red color family added for delete/remove actions and error states.

### ✅ 2. **Image Aspect Ratios**
Standardized: 1200x800 (3:2) for content, 1920x1080 (16:9) for heroes.

### ✅ 3. **Icon Library**
Huge Icons (Stroke style, Rounded type) adopted as standard.

### ✅ 4. **Animation Philosophy**
Minimal approach: hovers, focus states, and loading indicators only.

### ✅ 5. **Border Radius Standards**
Standardized by component type (buttons: md, cards: lg, etc.).

### ✅ 6. **Form Elements**
All form elements follow search bar aesthetic with consistent styling.

---

**End of Guidelines v1.0**

*This document should be reviewed quarterly and updated as the design system evolves.*
