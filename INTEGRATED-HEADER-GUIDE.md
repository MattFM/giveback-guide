# Integrated Header System

## Overview

The integrated header system allows your site's main navigation to sit on top of page hero sections, creating a seamless, modern design. The header can transition between transparent and solid states, and supports both light and dark themes.

## Features

- **Transparent Mode**: Header sits on top of hero section with no background
- **Scroll Behavior**: Automatically transitions to solid background on scroll
- **Theme Support**: Light (dark text) and dark (white text) themes
- **Responsive**: Works across all screen sizes
- **Non-Breaking**: Completely opt-in, existing pages unchanged

## Usage

### Basic Example (Transparent Header)

```astro
---
import MainLayout from "../layouts/MainLayout.astro";
import Hero from "../components/sections/Hero.astro";
---

<MainLayout 
  title="My Page"
  description="Page description"
  headerVariant="transparent"
  headerTheme="dark"
>
  <main>
    <Hero 
      title="Welcome to My Page"
      description="This is a subtitle"
      background="color"
      backgroundValue="var(--color-brand-600)"
      theme="dark"
    />
    
    <!-- Rest of your content -->
  </main>
</MainLayout>
```

### Default Example (Standard Header)

```astro
<MainLayout 
  title="My Page"
  description="Page description"
>
  <!-- No headerVariant prop = default solid white header -->
  <main>
    <!-- Your content -->
  </main>
</MainLayout>
```

## MainLayout Props

### `headerVariant`
- **Type**: `'default' | 'transparent'`
- **Default**: `'default'`
- **Description**: Controls header display mode

### `headerTheme`
- **Type**: `'light' | 'dark'`
- **Default**: `'light'`
- **Description**: Controls text/icon colors
  - `'light'`: Dark text on light background (default)
  - `'dark'`: White text on dark background

## Hero Component Props

### `title` (required)
- **Type**: `string`
- **Description**: Main heading text

### `description`
- **Type**: `string`
- **Optional**: Yes
- **Description**: Subtitle/description text

### `background`
- **Type**: `'color' | 'image' | 'gradient'`
- **Default**: `'color'`
- **Description**: Background type

### `backgroundValue`
- **Type**: `string`
- **Default**: `'var(--color-neutral-950)'`
- **Description**: CSS value for background
  - For `color`: Any CSS color value
  - For `image`: Image URL
  - For `gradient`: CSS gradient string

### `theme`
- **Type**: `'light' | 'dark'`
- **Default**: `'dark'`
- **Description**: Text color theme

### `size`
- **Type**: `'small' | 'medium' | 'large'`
- **Default**: `'medium'`
- **Description**: Hero section height
  - `small`: 40vh minimum
  - `medium`: 60vh minimum
  - `large`: 80vh minimum

### `align`
- **Type**: `'left' | 'center'`
- **Default**: `'left'`
- **Description**: Content alignment

## Examples

### 1. Solid Color Hero (Dark)

```astro
<MainLayout 
  headerVariant="transparent"
  headerTheme="dark"
>
  <Hero 
    title="Explore Thailand"
    description="Discover sustainable volunteer projects"
    background="color"
    backgroundValue="var(--color-brand-600)"
    theme="dark"
    size="large"
  />
</MainLayout>
```

### 2. Image Background Hero

```astro
<MainLayout 
  headerVariant="transparent"
  headerTheme="dark"
>
  <Hero 
    title="Make a Difference"
    description="Join our community of changemakers"
    background="image"
    backgroundValue="/images/hero-bg.jpg"
    theme="dark"
  />
</MainLayout>
```

### 3. Gradient Hero

```astro
<MainLayout 
  headerVariant="transparent"
  headerTheme="dark"
>
  <Hero 
    title="Get Started"
    description="Your journey begins here"
    background="gradient"
    backgroundValue="linear-gradient(135deg, var(--color-brand-600), var(--color-sage-600))"
    theme="dark"
    size="medium"
    align="center"
  />
</MainLayout>
```

### 4. Light Theme Hero

```astro
<MainLayout 
  headerVariant="transparent"
  headerTheme="light"
>
  <Hero 
    title="About Us"
    description="Learn our story"
    background="color"
    backgroundValue="var(--color-neutral-50)"
    theme="light"
  />
</MainLayout>
```

### 5. Hero with CTA Buttons

```astro
<Hero 
  title="Join Our Community"
  description="Connect with travelers and volunteers worldwide"
  background="color"
  backgroundValue="var(--color-sage-700)"
  theme="dark"
>
  <div style="display: flex; gap: 1rem; margin-top: 2rem;">
    <a href="/join" class="btn btn-primary">Get Started</a>
    <a href="/about" class="btn btn-outline" style="color: white; border-color: white;">
      Learn More
    </a>
  </div>
</Hero>
```

## Header Scroll Behavior

When using `headerVariant="transparent"`, the header automatically:

1. **At top of page**: Transparent background, theme colors apply
2. **After scrolling 50px**: Transitions to solid background with subtle backdrop blur
3. **Dark theme**: Automatically adjusts to light colors when scrolled (for readability)

## Available Color Variables

Use these in your `backgroundValue` prop:

### Neutrals
- `var(--color-neutral-50)` through `var(--color-neutral-950)`

### Brand Colors
- **Purple**: `var(--color-brand-50)` through `var(--color-brand-800)`
- **Sage**: `var(--color-sage-50)` through `var(--color-sage-800)`
- **Terracotta**: `var(--color-terracotta-50)` through `var(--color-terracotta-800)`

### Custom Giveback Guide Colors
- `var(--color-gbgblue)`: #295483
- `var(--color-gbgpink)`: #f1e8fb
- `var(--color-gbgyellow)`: #ffe8b5
- `var(--color-gbgteal)`: #b7e5e5

## Migration Path

### Phase 1: Test on Design System Page
- Already implemented on `/design-system`
- Review and iterate on the design

### Phase 2: Add to High-Impact Pages
Consider adding to:
- Homepage (`/`)
- About page (`/about`)
- Country overview pages
- Project category pages

### Phase 3: Evaluate Content Pages
Decide which individual project/stay pages benefit from integrated headers

### Phase 4: Document Best Practices
Based on real usage, document when to use transparent vs. default headers

## Best Practices

### When to Use Transparent Headers

✅ **Good for:**
- Homepage
- Landing pages
- Category overview pages
- About/mission pages
- Pages with strong visual content

❌ **Avoid for:**
- Dense content pages
- Forms and data entry
- Dashboard/admin pages
- Pages with tables or complex layouts

### Accessibility

- Text contrast is automatically managed
- Focus indicators remain visible
- Screen reader navigation unchanged
- Keyboard shortcuts still work

### Performance

- Minimal CSS, no heavy JavaScript
- Scroll listener uses `passive: true` for performance
- No layout shift or flicker
- Works with Astro view transitions

## Troubleshooting

### Header overlaps content
Make sure your first content section doesn't have excessive negative margin. The Hero component handles spacing automatically.

### Colors don't match
Ensure you're using the correct theme prop on both MainLayout and Hero components.

### Header doesn't transition
Check that you've set `headerVariant="transparent"` on MainLayout.

### Mobile menu issues
The header remains responsive. Test at different breakpoints.

## Future Enhancements

Potential additions (not yet implemented):

- Header color customization per page
- Animation options for hero content
- Parallax scrolling effects
- Video backgrounds
- Multiple hero layouts (split, full-bleed, etc.)

## Questions or Issues?

If you encounter any problems or have suggestions, please document them for future reference.
