> **Internal Documentation** | Interactive Examples
> 
> **Page:** Hero Component Showcase  
> **File:** `src/pages/staff/examples/hero-examples.astro`  
> **Type:** Interactive Component Page

# Hero Examples Page - Summary

## Overview

This is a **live, interactive page** demonstrating the different Hero component configurations and the transparent header system in action.

---

## Hero Variations Shown

### 1. Solid Color Hero (Dark)

**Configuration:**
- Background: Color (purple brand)
- Theme: Dark (white text)
- Size: Large (80vh)
- Alignment: Left

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

### 2. Image Background Hero

**Configuration:**
- Background: Image
- Theme: Dark
- Size: Medium (60vh)

```astro
<Hero 
  title="Make a Difference"
  description="Join our community"
  background="image"
  backgroundValue="/images/hero-bg.jpg"
  theme="dark"
/>
```

### 3. Gradient Hero

**Configuration:**
- Background: Gradient (purple to sage)
- Theme: Dark
- Size: Medium
- Alignment: Center
- CTA Buttons: Included

```astro
<Hero 
  title="Get Started"
  description="Your journey begins here"
  background="gradient"
  backgroundValue="linear-gradient(135deg, #9333ea, #4a5e4a)"
  theme="dark"
  size="medium"
  align="center"
>
  <div style="display: flex; gap: 1rem; margin-top: 2rem;">
    <a href="/join" class="btn btn-primary">Get Started</a>
    <a href="/about" class="btn btn-outline" style="color: white;">
      Learn More
    </a>
  </div>
</Hero>
```

### 4. Light Theme Hero

**Configuration:**
- Background: Color (light neutral)
- Theme: Light (dark text)
- Size: Medium

```astro
<Hero 
  title="About Us"
  description="Learn our story"
  background="color"
  backgroundValue="var(--color-neutral-50)"
  theme="light"
/>
```

---

## Key Features

### Transparent Header Demonstration

**Scroll down the page to see:**
1. **At top**: Header is completely transparent
2. **After ~50px scroll**: Header transitions to solid with blur
3. **Dark theme**: Colors automatically switch for readability

### Hero Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Main heading |
| `description` | `string` | - | Subtitle |
| `background` | `'color' \| 'image' \| 'gradient'` | `'color'` | Background type |
| `backgroundValue` | `string` | - | CSS value |
| `theme` | `'light' \| 'dark'` | `'dark'` | Text theme |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Hero height |
| `align` | `'left' \| 'center'` | `'left'` | Content alignment |

### Size Options

| Size | Height | Best For |
|------|--------|----------|
| Small | 40vh | Secondary pages |
| Medium | 60vh | Standard pages |
| Large | 80vh | Homepage, impact |

---

## How to View

**This is an interactive page, not a document.**

To see the actual examples:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:4321/staff/examples/hero-examples
   ```

3. **Important:** Scroll down to see the transparent header transition

4. Resize browser to see responsive behavior

---

## Technical Details

| Property | Value |
|----------|-------|
| **Framework** | Astro |
| **Components** | Hero.astro, Button.astro |
| **Header** | Transparent with scroll transition |
| **Layout** | MainLayout with transparent variant |

---

## File Location

```
src/pages/staff/examples/hero-examples.astro
```

---

## Note

This markdown file is a **summary only**. The actual page is an interactive Astro component with working heroes and a live transparent header. You must view it in a browser with the dev server running (and scroll!) to see the full effect.
