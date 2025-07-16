# Responsive Images with Cloudinary

This implementation provides responsive images using Cloudinary's URL transformation features without requiring Astro to process images or manual URL entry in Notion.

## How It Works

1. **Cloudinary URL Transformation**: Automatically modifies your existing Cloudinary URLs to add responsive parameters
2. **Automatic Srcsets**: Generates multiple image sizes for different screen sizes
3. **Smart Sizing**: Maintains aspect ratios and provides fallbacks
4. **No Manual Work**: Uses your existing single Cloudinary URL from Notion

## Usage

### Simple Usage with Presets

```astro
<!-- Hero/Featured Images -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="hero"
  class="w-full rounded-lg"
/>

<!-- Card Images in Grids -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="card"
  class="w-full h-64 object-cover"
/>

<!-- Thumbnails -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="thumbnail"
/>

<!-- Avatar/Profile Images -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="avatar"
/>
```

### Custom Configuration

```astro
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  fallbackWidth={800}
  sizes={[
    { width: 400 },
    { width: 600 },
    { width: 800 }
  ]}
  sizesAttribute={[
    "(max-width: 640px) 100vw",
    "(max-width: 1024px) 50vw",
    "800px"
  ]}
  quality={90}
  format="auto"
/>
```

### Standalone Images on Static Pages

For static pages where you want to add responsive images directly (like About pages, landing pages, etc.):

```astro
---
import ResponsiveImage from '../components/ResponsiveImage.astro';
---

<!-- Direct Cloudinary URL usage -->
<ResponsiveImage
  src="https://res.cloudinary.com/dnxl7wsnx/image/upload/v1744197180/matt-jade-singapore-cloud-forest_wc25cv.jpg"
  alt="Matt and Jade in the Cloud Forest, Gardens by the Bay, Singapore"
  preset="hero"
  class="mb-4 h-auto max-w-full rounded-lg"
/>

<!-- Multiple images in a grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <ResponsiveImage
    src="https://res.cloudinary.com/dnxl7wsnx/image/upload/v1744197198/oslo-fjord-clean-up_yydfap.jpg"
    alt="A group of paddleboarders help to clean up Oslo Fjord"
    preset="card"
    class="h-auto max-w-full rounded-lg"
  />
  <ResponsiveImage
    src="https://res.cloudinary.com/dnxl7wsnx/image/upload/v1744197237/santorini-animal-welfare_zduqln.jpg"
    alt="A group of volunteers help to care for animals in Santorini"
    preset="card"
    class="h-auto max-w-full rounded-lg"
  />
</div>

<!-- Small profile/avatar images -->
<ResponsiveImage
  src="https://res.cloudinary.com/dnxl7wsnx/image/upload/v1747295511/matt-avatar_lvrazy.jpg"
  alt="Matt's profile photo"
  preset="avatar"
  class="w-32 h-32 rounded-full object-cover"
/>
```

## Available Presets

- **`hero`**: Full-width featured images (640px → 1600px)
- **`card`**: Grid card images (300px → 600px)
- **`thumbnail`**: Small preview images (150px → 300px)
- **`avatar`**: Profile/avatar images (64px → 200px)

## Generated Output

For a Cloudinary URL like:
```
https://res.cloudinary.com/dnxl7wsnx/image/upload/v1747744963/example_image.jpg
```

The system generates:
```html
<img
  src="https://res.cloudinary.com/dnxl7wsnx/image/upload/w_1200,q_85,f_auto/v1747744963/example_image.jpg"
  srcset="
    https://res.cloudinary.com/dnxl7wsnx/image/upload/w_640,q_85,f_auto/v1747744963/example_image.jpg 640w,
    https://res.cloudinary.com/dnxl7wsnx/image/upload/w_768,q_85,f_auto/v1747744963/example_image.jpg 768w,
    https://res.cloudinary.com/dnxl7wsnx/image/upload/w_1024,q_85,f_auto/v1747744963/example_image.jpg 1024w,
    https://res.cloudinary.com/dnxl7wsnx/image/upload/w_1200,q_85,f_auto/v1747744963/example_image.jpg 1200w"
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1200px"
  alt="Description"
  width="1200"
  height="800"
  loading="lazy"
/>
```

## Performance Benefits

- **Bandwidth Savings**: Smaller images for mobile devices
- **Faster Loading**: Right-sized images for each viewport
- **Better UX**: Images load faster on slower connections
- **SEO Friendly**: Proper width/height attributes prevent layout shift
- **Modern Formats**: Automatic WebP/AVIF support via Cloudinary
- **Lazy Loading**: Built-in lazy loading support

## Configuration Options

- **`quality`**: Image quality (1-100, default: 85)
- **`format`**: Image format options:
  - `'auto'` (default): Cloudinary automatically serves WebP/AVIF based on browser support
  - `'webp'`: Force WebP format
  - `'avif'`: Force AVIF format (newest, best compression)
  - `'jpg'`/`'png'`: Force specific formats
- **`maintainAspectRatio`**: Keep original 1200x800 aspect ratio
- **`loading`**: 'lazy' or 'eager' loading
- **`fetchpriority`**: 'high', 'low', or 'auto' for LCP optimization
- **`showSkeleton`**: Enable/disable skeleton loading animation (default: true)

## Modern Image Formats

The implementation automatically serves modern image formats (WebP/AVIF) through Cloudinary's `f_auto` parameter:

### Format Selection (with `format="auto"`)
- **AVIF**: Newest browsers (Chrome 85+, Firefox 93+) - Best compression
- **WebP**: Modern browsers (Chrome, Firefox, Safari 14+, Edge) - Good compression  
- **JPEG**: Fallback for older browsers

### Browser Support Examples
- Chrome/Edge/Firefox (recent): Gets AVIF or WebP (~30-50% smaller files)
- Safari (recent): Gets WebP (~25-35% smaller files)
- Older browsers: Gets original JPEG format

### Custom Format Options
```astro
<!-- Let Cloudinary choose best format (recommended) -->
<ResponsiveImage src={url} preset="hero" format="auto" />

<!-- Force WebP (good browser support) -->
<ResponsiveImage src={url} preset="hero" format="webp" />

<!-- Force AVIF (best compression, newer browsers only) -->
<ResponsiveImage src={url} preset="hero" format="avif" />
```

## Disabling Transformations

You can easily disable Cloudinary transformations if needed. This is useful for:
- Testing without using transformation credits
- Troubleshooting issues
- Temporarily reducing Cloudinary usage

### Global Toggle

Edit `src/utils/cloudinary.ts` to disable all transformations:

```typescript
export const CLOUDINARY_CONFIG = {
  enableTransformations: false,  // ← Set to false
  enableResponsiveImages: true,
  enableFormatOptimization: true,
  enableQualityOptimization: true,
};
```

### Selective Disabling

You can also disable specific features:

```typescript
export const CLOUDINARY_CONFIG = {
  enableTransformations: true,
  enableResponsiveImages: false,     // ← No responsive sizes
  enableFormatOptimization: false,   // ← No WebP/AVIF
  enableQualityOptimization: false,  // ← No quality compression
};
```

When transformations are disabled:
- ✅ Your images still work (original URLs are used)
- ✅ No Cloudinary transformation credits consumed
- ✅ No build errors or broken images
- ❌ No performance benefits from responsive sizing

## Loading Animations

The ResponsiveImage component includes skeleton loading animations by default using Flowbite's design system. This improves perceived performance while images are loading.

### Skeleton Loading Features

- **Automatic**: Enabled by default (`showSkeleton={true}`)
- **Flowbite Design**: Uses consistent gray backgrounds with pulse animation
- **Smooth Transition**: Images fade in when loaded (300ms transition)
- **Error Handling**: Shows broken image icon if loading fails
- **Accessibility**: Proper ARIA labels and status indicators

### Usage Examples

```astro
<!-- Default: Skeleton enabled -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="hero"
  class="w-full rounded-lg"
/>

<!-- Disable skeleton loading -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="hero"
  class="w-full rounded-lg"
  showSkeleton={false}
/>

<!-- Custom styling with skeleton -->
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="card"
  class="w-full h-64 object-cover rounded-xl shadow-lg"
/>
```

### How It Works

1. **Initial State**: Skeleton overlay shows with pulsing animation
2. **Loading**: Image loads in background with `opacity: 0`
3. **Success**: Image fades in and skeleton disappears
4. **Error**: Skeleton shows broken image icon

### Customization

The skeleton inherits the same border radius and positioning as your main component:

```astro
<!-- Round skeleton for avatar -->
<ResponsiveImage
  src={avatarUrl}
  alt="Profile"
  preset="avatar"
  class="w-24 h-24 rounded-full"
/>

<!-- Square skeleton for cards -->
<ResponsiveImage
  src={cardUrl}
  alt="Card image"
  preset="card"
  class="w-full h-48 rounded-lg"
/>
```

**Note**: The `class` attribute is applied to both the skeleton and the final image, ensuring consistent styling throughout the loading process.

## Files

- `src/utils/cloudinary.ts` - Core utilities and presets
- `src/components/ResponsiveImage.astro` - Reusable component
- Updated components: `ProjectPage.astro`, `ProjectCard.astro`, `PostLayout.astro`, `PostCard.astro`, `StayPage.astro`, `StayCard.astro`

## Reverting to Previous Implementation

If you need to undo the responsive images implementation and return to your previous setup, follow these steps:

### Quick Revert (Keep Files, Disable Features)

The fastest way is to disable transformations while keeping all files intact:

1. **Disable Cloudinary transformations** in `src/utils/cloudinary.ts`:
   ```typescript
   export const CLOUDINARY_CONFIG = {
     enableTransformations: false,  // ← Set to false
     enableResponsiveImages: true,
     enableFormatOptimization: true,
     enableQualityOptimization: true,
   };
   ```

2. **Replace ResponsiveImage components** with regular `<img>` tags in your components:
   ```astro
   <!-- Change this: -->
   <ResponsiveImage
     src={cloudinaryUrl}
     alt="Description"
     preset="hero"
     class="w-full rounded-lg"
   />
   
   <!-- Back to this: -->
   <img
     src={cloudinaryUrl}
     alt="Description"
     class="w-full rounded-lg"
   />
   ```

### Complete Removal

If you want to completely remove all responsive image files:

#### 1. Delete Created Files
```bash
# Remove responsive image utilities
rm src/utils/cloudinary.ts

# Remove responsive image component
rm src/components/ResponsiveImage.astro

# Remove documentation and test files
rm RESPONSIVE_IMAGES.md
rm responsive-images-test.html
rm skeleton-loading-test.html
```

#### 2. Revert Component Files

Update these files to restore original `<img>` tags:

**Files to revert:**
- `src/layouts/ProjectPage.astro`
- `src/components/ProjectCard.astro`
- `src/layouts/PostLayout.astro`
- `src/components/PostCard.astro`
- `src/layouts/StayPage.astro`
- `src/components/StayCard.astro`

**Example reversion for ProjectPage.astro:**
```astro
<!-- Change back from: -->
<ResponsiveImage
  src={project.data.coverImage}
  alt={project.data.coverImageAlt}
  preset="hero"
  class="w-full h-64 md:h-80 object-cover"
/>

<!-- To original: -->
<img
  src={project.data.coverImage}
  alt={project.data.coverImageAlt}
  class="w-full h-64 md:h-80 object-cover"
/>
```

#### 3. Remove Import Statements

Remove ResponsiveImage imports from the top of each component file:
```astro
// Remove this line:
import ResponsiveImage from '../components/ResponsiveImage.astro';
```

#### 4. Test Your Site

```bash
npm run build
npm run dev
```

### Backup Strategy

Before making changes, you can create a backup:

```bash
# Create a backup branch
git checkout -b backup-before-responsive-images

# Commit current state
git add .
git commit -m "Backup before removing responsive images"

# Return to main branch
git checkout main
```

### What You'll Lose by Reverting

- **Performance gains**: No more responsive image sizing
- **Bandwidth savings**: Back to serving full-size images to mobile
- **Modern formats**: No automatic WebP/AVIF optimization
- **Loading animations**: No skeleton loading animations
- **SEO benefits**: No width/height attributes for layout stability

### What You'll Keep

- **Working images**: All your existing Cloudinary URLs continue working
- **No broken links**: Your site will function exactly as before
- **Same design**: Visual appearance remains identical
- **Notion workflow**: No changes needed to your content management

### Partial Revert Options

You can also selectively disable features:

```typescript
// Keep responsive sizing, disable modern formats
export const CLOUDINARY_CONFIG = {
  enableTransformations: true,
  enableResponsiveImages: true,
  enableFormatOptimization: false,  // ← Disable WebP/AVIF
  enableQualityOptimization: true,
};

// Keep optimizations, disable skeleton loading
<ResponsiveImage
  src={cloudinaryUrl}
  alt="Description"
  preset="hero"
  showSkeleton={false}  // ← Disable skeleton
/>
```

### Re-enabling Later

To re-enable the responsive images system:

1. Restore the deleted files (or recreate them)
2. Update components to use `<ResponsiveImage>` again
3. Set `enableTransformations: true` in the config
4. Run `npm run build` to test

The system is designed to be easily toggled on/off without breaking your site.
