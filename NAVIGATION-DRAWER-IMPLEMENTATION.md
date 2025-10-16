# Navigation Drawer Implementation

## Overview
A standalone, reusable slide-in drawer component that slides from the right side of the screen. Currently used for mobile navigation but designed to be extended to all screen sizes. Uses custom vanilla JavaScript (no Flowbite dependency).

## Component Structure

### NavigationDrawer.astro
Standalone component in `/src/components/layout/NavigationDrawer.astro`

**Props:**
- `theme?: 'light' | 'dark'` - Inherits theme from parent Header

**Features:**
- ✅ Wider drawer (320px / w-80) with room for future content
- ✅ Custom vanilla JS (no Flowbite dependency)
- ✅ Prevents body scroll when open (fixes content jump)
- ✅ Keyboard accessible (ESC to close)
- ✅ Click outside to close
- ✅ Clean, extensible structure (ready for all screen sizes)

## Implementation Details

### Mobile Menu (< lg breakpoint)
- **Type**: Right-side slide-in drawer
- **Width**: 20rem (80 / 320px) - increased from 256px
- **Background**: Solid white (light mode) / gray-900 (dark mode)
- **Animation**: Smooth 300ms ease-in-out slide transition
- **Features**:
  - Backdrop overlay with blur when open
  - Close button in header
  - Vertically scrollable if content overflows
  - Hover states on menu items
  - Auto-closes on navigation
  - **Prevents page content shift** via `overflow: hidden` on body

### Desktop Menu (≥ lg breakpoint)
- **Type**: Inline horizontal navigation
- **Position**: Top header bar
- **Styling**: Theme-aware (adapts to light/dark variants)

## Technical Implementation

### Custom JavaScript
```javascript
// Pure vanilla JS - No Flowbite dependency
function initMobileMenu() {
  // Get elements
  const menuButton = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');
  const closeButton = document.getElementById('mobile-menu-close');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  
  // Open: Remove translate-x-full, show backdrop, lock body
  function openMenu() {
    menu.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Fixes content jump!
    // ... ARIA updates
  }
  
  // Close: Reverse all changes
  function closeMenu() {
    menu.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scroll
    // ... ARIA updates
  }
  
  // Event listeners: button, backdrop, ESC key, nav clicks
}
```

### Key Elements
- `#mobile-menu-button` - Hamburger button in header
- `#mobile-menu` - The drawer itself
- `#mobile-menu-close` - X button inside drawer
- `#mobile-menu-backdrop` - Semi-transparent overlay

### CSS Classes
- `translate-x-full` - Initial hidden state (off-screen right)
- `transition-transform duration-300 ease-in-out` - Smooth animation
- `fixed inset-y-0 right-0` - Positions drawer on right edge
- `z-50` - Appears above most content (backdrop is z-40)
- `w-80` - 320px width

## Benefits
1. ✅ **Solid background** - No transparency issues
2. ✅ **No content jump** - Body scroll locked when open
3. ✅ **Reusable component** - Easy to maintain and extend
4. ✅ **No Flowbite dependency** - Custom vanilla JS
5. ✅ **Better UX** - Standard mobile pattern users expect
6. ✅ **Easy to extend** - Can add secondary nav, user profile, etc.
7. ✅ **Accessible** - Proper ARIA attributes and focus management
8. ✅ **Clean separation** - Desktop and mobile menus are distinct
9. ✅ **Wider drawer** - More space for future features

## Future Enhancements
- Add user authentication section
- Add search functionality
- Add settings/help links
- Add social media links
- Stagger animation for menu items
- Could extend to desktop as persistent sidebar
- Add section dividers for different types of content
