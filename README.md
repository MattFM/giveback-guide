# Giveback Guide

A travel-focused platform built with Astro that helps users discover meaningful ways to give back to the places they visit through animal sanctuaries, cultural exchanges, social impact projects, and sustainable travel experiences.

## Tech Stack

- **Framework**: Astro 5.10.0 with Static Site Generation
- **Styling**: TailwindCSS 4.1.3 with Flowbite components
- **Database**: Supabase
- **Deployment**: Cloudflare Workers (via Wrangler)
- **Search**: Pagefind integration
- **Content**: MDX support with RSS feeds

## Project Structure

### Root Configuration Files
- `astro.config.mjs` - Astro configuration with MDX, sitemap, and Pagefind
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `wrangler.jsonc` - Cloudflare Workers deployment config
- `RESPONSIVE_IMAGES.md` - Documentation for image handling

### Database (`/migrations/`)
SQL migration files for database schema:
- `001_create_saved_lists.sql` - User saved lists functionality
- `002_normalize_item_id.sql` - Item ID normalization
- `003_create_user_item_status.sql` - User item status tracking

### Public Assets (`/public/`)
Static assets served directly:
- `favicon.png` - Site favicon
- `give-back-avatar.svg` - Brand avatar
- `giveback-guide-placeholder.jpg` - Default placeholder image
- `robots.txt` - Search engine crawler instructions

### Source Code (`/src/`)

#### Core Configuration
- `consts.ts` - Global constants (site title, description)
- `content.config.ts` - Content collection configuration

#### Assets (`/src/assets/`)
- Brand assets (avatars, favicons)
- `/ads/` - Advertisement assets (G Adventures)

#### Components (`/src/components/`)

**Layout & Navigation:**
- `BaseHead.astro` - HTML head metadata
- `Header.astro` & `HeaderLink.astro` - Site navigation
- `Footer.astro` - Site footer
- `Analytics.astro` - Analytics tracking

**Content Display:**
- `PostCard.astro` - Blog post preview cards
- `ProjectCard.astro` - Project showcase cards
- `StayCard.astro` - Accommodation display cards
- `FormattedDate.astro` - Date formatting utility
- `ResponsiveImage.astro` & `ResponsiveImageWithSkeleton.astro` - Image handling

**Interactive Elements:**
- `Announcement.astro` - Site announcements
- `ProjectsToolbar.astro` - Project filtering toolbar
- Various dropdown components for filtering:
  - `BTagsDropdown.astro` - Blog tags
  - `PCategoryDropdown.astro` - Project categories
  - `PCountryDropdown.astro` - Project countries
  - `PLocaleDropdown.astro` - Project locales
  - `SCountryDropdown.astro` - Stay countries
  - `SLocaleDropdown.astro` - Stay locales

**Specialized Components:**
- `/Ads/AdBox.astro` - Advertisement display
- `/Homepage/` - Homepage-specific components:
  - `HomeHero.astro` - Hero section
  - `LatestPosts.astro` - Recent blog posts
  - `LatestProjects.astro` - Recent projects
  - `LatestStays.astro` - Recent stays
- `/Popups/SubscribeDrawer.astro` - Newsletter subscription
- `/Projects/SupportBox.astro` - Project support information
- `/Save/` - User save functionality:
  - `SaveToList.astro` - Save to list component
  - `saveToList.client.js` - Client-side save logic

#### Layouts (`/src/layouts/`)
Page layout templates:
- `MainLayout.astro` - Base site layout
- `PostLayout.astro` - Blog post layout
- `ProjectPage.astro` - Project detail layout
- `StayPage.astro` - Accommodation detail layout

#### Utilities (`/src/lib/`)
Business logic and integrations:
- `auth.ts` - Authentication handling
- `completed.ts` - Completion tracking
- `lists.ts` - User list management
- `supabase.ts` - Database client configuration

#### Pages (`/src/pages/`)

**Main Pages:**
- `index.astro` - Homepage
- `search.astro` & `_search.astro` - Search functionality
- `404.astro` - Error page
- `beta.astro`, `concierge.astro`, `contact.astro` - Feature pages
- `privacy.astro`, `terms.astro` - Legal pages
- `report.astro`, `submit.astro`, `support.astro` - User actions
- `sustainability.astro`, `why.astro` - Content pages
- `verify.astro` - Email verification
- `rss.xml.js` - RSS feed generation

**Dynamic Routes:**
- `/_blog/` - Blog system:
  - `[...page].astro` - Blog pagination
  - `[...slug].astro` - Individual blog posts
- `/blog/` - Blog display:
  - `[...page].astro` - Blog listing with pagination
  - `[...slug].astro` - Blog post display
  - `/[tag]/` - Tag-based filtering
- `/projects/` - Project showcase (dynamic routes)
- `/stays/` - Accommodation listings (dynamic routes)

**User Features:**
- `/auth/` - Authentication system:
  - `dashboard.astro` - User dashboard
  - `dashboard.client.js` - Dashboard client logic
  - `login.astro` - Login page
  - `onboarding.astro` - User onboarding
  - `profile.astro` - User profile
  - `verify.astro` - Account verification
- `/join/` - User registration:
  - `confirm.astro` - Registration confirmation

**About Section:**
- `/about/` - Company information:
  - `index.astro` - Main about page
  - `advertising.astro` - Advertising information
  - `ai-statement.astro` - AI usage policy
  - `impacts.astro` - Impact reporting
  - `verification.astro` - Verification process

**API Endpoints:**
- `/api/items.json.ts` - Items API endpoint

#### Utilities (`/src/utils/`)
Helper functions:
- `cloudinary.ts` - Image optimization with Cloudinary
- `impactAreas.ts` - Impact area definitions

#### Styling (`/src/styles/`)
- `global.css` - Global styles and Tailwind imports

#### Scripts (`/src/scripts/`)
Build and utility scripts

## Key Features

1. **Content Management**: MDX-based blog with RSS feeds
2. **Search**: Integrated Pagefind for fast site search
3. **User Authentication**: Supabase-powered auth system
4. **Saved Lists**: Users can save and organize content
5. **Responsive Images**: Cloudinary integration with skeleton loading
6. **Filtering**: Multiple dropdown filters for projects and stays
7. **Multi-language Support**: Locale-based filtering
8. **Social Impact Tracking**: Impact areas and completion tracking

## Potential Cleanup Opportunities

### Consolidation Candidates:
1. **Dropdown Components**: Multiple similar dropdown components could potentially be consolidated into a generic dropdown with props
2. **Card Components**: `PostCard`, `ProjectCard`, and `StayCard` might share common patterns
3. **Image Components**: `ResponsiveImage` and `ResponsiveImageWithSkeleton` could potentially be merged
4. **Authentication**: Multiple auth-related pages could share more common components

### Organization Improvements:
1. **Country/Locale Logic**: Could be centralized since it's used across multiple dropdowns
2. **API Endpoints**: Currently only one API endpoint - consider if more are needed or if structure should change
3. **Client Scripts**: Only one client script in components - consider if more interactive features need client-side code

### Documentation Needs:
1. **Component Props**: Consider documenting component interfaces
2. **Database Schema**: Document the relationship between migrations and current schema
3. **Content Types**: Document the structure of projects, stays, and blog posts
4. **Deployment Process**: Document the build and deployment workflow

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run deploy   # Build and deploy to Cloudflare Workers
```

## Database

The project uses Supabase with a migration-based schema. Current migrations handle:
- User saved lists functionality
- Item ID normalization
- User item status tracking

## Deployment

Deployed on Cloudflare Workers using Wrangler, with static assets served from the `dist` directory.