# Import Path Update Reference

**Quick reference for updating component imports after migration**

---

## VS Code Search & Replace

Press `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows/Linux) to open global search.

### Layout Components

**Search:** `from '@/components/Header.astro'`  
**Replace:** `from '@/components/layout/Header.astro'`

**Search:** `from '@/components/HeaderLink.astro'`  
**Replace:** `from '@/components/layout/HeaderLink.astro'`

**Search:** `from '@/components/Footer.astro'`  
**Replace:** `from '@/components/layout/Footer.astro'`

**Search:** `from '@/components/BaseHead.astro'`  
**Replace:** `from '@/components/layout/BaseHead.astro'`

---

### Content Components

**Search:** `from '@/components/PostCard.astro'`  
**Replace:** `from '@/components/content/PostCard.astro'`

**Search:** `from '@/components/ProjectCard.astro'`  
**Replace:** `from '@/components/content/ProjectCard.astro'`

**Search:** `from '@/components/StayCard.astro'`  
**Replace:** `from '@/components/content/StayCard.astro'`

**Search:** `from '@/components/ProjectsToolbar.astro'`  
**Replace:** `from '@/components/content/ProjectsToolbar.astro'`

**Search:** `from '@/components/FormattedDate.astro'`  
**Replace:** `from '@/components/content/FormattedDate.astro'`

---

### UI Components - Dropdowns

**Search:** `from '@/components/BTagsDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/BlogTagsDropdown.astro'`

**Search:** `from '@/components/PCategoryDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/ProjectCategoryDropdown.astro'`

**Search:** `from '@/components/PCountryDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/ProjectCountryDropdown.astro'`

**Search:** `from '@/components/PLocaleDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/ProjectLocaleDropdown.astro'`

**Search:** `from '@/components/SCountryDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/StayCountryDropdown.astro'`

**Search:** `from '@/components/SLocaleDropdown.astro'`  
**Replace:** `from '@/components/ui/Dropdown/StayLocaleDropdown.astro'`

---

### UI Components - Images

**Search:** `from '@/components/ResponsiveImage.astro'`  
**Replace:** `from '@/components/ui/Image/ResponsiveImage.astro'`

**Search:** `from '@/components/ResponsiveImageWithSkeleton.astro'`  
**Replace:** `from '@/components/ui/Image/ResponsiveImageWithSkeleton.astro'`

---

### Section Components

**Search:** `from '@/components/Homepage/HomeHero.astro'`  
**Replace:** `from '@/components/sections/HomeHero.astro'`

**Search:** `from '@/components/Homepage/LatestPosts.astro'`  
**Replace:** `from '@/components/sections/LatestPosts.astro'`

**Search:** `from '@/components/Homepage/LatestProjects.astro'`  
**Replace:** `from '@/components/sections/LatestProjects.astro'`

**Search:** `from '@/components/Homepage/LatestStays.astro'`  
**Replace:** `from '@/components/sections/LatestStays.astro'`

**Search:** `from '@/components/Projects/SupportBox.astro'`  
**Replace:** `from '@/components/sections/SupportBox.astro'`

---

### Feature Components

**Search:** `from '@/components/Save/SaveToList.astro'`  
**Replace:** `from '@/components/features/save/SaveToList.astro'`

**Search:** `from '@/components/Save/saveToList.client'`  
**Replace:** `from '@/components/features/save/saveToList.client'`

**Search:** `from '@/components/Ads/AdBox.astro'`  
**Replace:** `from '@/components/features/ads/AdBox.astro'`

**Search:** `from '@/components/Popups/SubscribeDrawer.astro'`  
**Replace:** `from '@/components/features/popups/SubscribeDrawer.astro'`

**Search:** `from '@/components/Announcement.astro'`  
**Replace:** `from '@/components/features/popups/Announcement.astro'`

---

### Utility Components

**Search:** `from '@/components/Analytics.astro'`  
**Replace:** `from '@/components/utility/Analytics.astro'`

**Search:** `from '@/components/TestListsClient.astro'`  
**Replace:** `from '@/components/utility/TestListsClient.astro'`

---

## Alternative: Using sed (Command Line)

If you prefer command-line replacements:

```bash
# Layout components
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/Header.astro|@/components/layout/Header.astro|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/Footer.astro|@/components/layout/Footer.astro|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/BaseHead.astro|@/components/layout/BaseHead.astro|g' {} +

# Content components
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/PostCard.astro|@/components/content/PostCard.astro|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/ProjectCard.astro|@/components/content/ProjectCard.astro|g' {} +
find src -type f -name "*.astro" -exec sed -i '' 's|@/components/StayCard.astro|@/components/content/StayCard.astro|g' {} +

# Add more as needed...
```

---

## Verification Commands

After updating imports, verify no broken references remain:

```bash
# Check for any remaining old import paths
grep -r "from '@/components/[A-Z]" src/ --include="*.astro" | grep -v "layout\|content\|sections\|features\|utility\|ui"

# Check for relative imports that might be broken
grep -r "from '\.\./\.\./components/[A-Z]" src/ --include="*.astro"

# Check for any references to old folder structure
grep -r "components/Homepage" src/
grep -r "components/Ads" src/
grep -r "components/Save" src/
grep -r "components/Popups" src/
```

---

## Component Name Changes

Don't forget these components were renamed:

| Old Name | New Name |
|----------|----------|
| `BTagsDropdown` | `BlogTagsDropdown` |
| `PCategoryDropdown` | `ProjectCategoryDropdown` |
| `PCountryDropdown` | `ProjectCountryDropdown` |
| `PLocaleDropdown` | `ProjectLocaleDropdown` |
| `SCountryDropdown` | `StayCountryDropdown` |
| `SLocaleDropdown` | `StayLocaleDropdown` |

Update component usages in templates:

**Before:**
```astro
<BTagsDropdown />
```

**After:**
```astro
<BlogTagsDropdown />
```

---

## Priority Order

Update imports in this order to minimize errors:

1. **Layout files** (`src/layouts/`) - Most critical
2. **Homepage** (`src/pages/index.astro`)
3. **Blog pages** (`src/pages/_blog/`, `src/pages/blog/`)
4. **Project pages** (`src/pages/projects/`)
5. **Stay pages** (`src/pages/stays/`)
6. **Other pages** (`src/pages/`)
7. **Components** that import other components

---

## Testing Checklist

After each batch of updates:

- [ ] `npm run dev` starts without errors
- [ ] Homepage loads
- [ ] Blog pages load
- [ ] Project pages load
- [ ] Stay pages load
- [ ] Navigation works
- [ ] No console errors in browser
