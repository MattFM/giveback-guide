#!/bin/bash

# Component Migration Script for Give Back Guide
# Implements Option 3 - Hybrid Organization
# Run from project root: bash migrate-components.sh

set -e  # Exit on error

echo "🚀 Starting Component Migration to Hybrid Structure..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "src/components" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Backup check
echo -e "${YELLOW}⚠️  IMPORTANT: Have you created a backup branch?${NC}"
echo "   Recommended: git checkout -b backup-before-component-migration"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting migration."
    exit 1
fi

echo ""
echo "Phase 1: Creating new directory structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p src/components/ui/Dropdown
mkdir -p src/components/ui/Image
mkdir -p src/components/layout
mkdir -p src/components/content
mkdir -p src/components/sections
mkdir -p src/components/features/save
mkdir -p src/components/features/ads
mkdir -p src/components/features/popups
mkdir -p src/components/utility

echo -e "${GREEN}✓ Directory structure created${NC}"
echo ""

echo "Phase 2: Moving components..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2.1 UI Components - Dropdowns
echo "  → Moving dropdown components..."
if [ -f "src/components/BTagsDropdown.astro" ]; then
    mv src/components/BTagsDropdown.astro src/components/ui/Dropdown/BlogTagsDropdown.astro
    echo -e "${GREEN}    ✓ BlogTagsDropdown${NC}"
fi

if [ -f "src/components/PCategoryDropdown.astro" ]; then
    mv src/components/PCategoryDropdown.astro src/components/ui/Dropdown/ProjectCategoryDropdown.astro
    echo -e "${GREEN}    ✓ ProjectCategoryDropdown${NC}"
fi

if [ -f "src/components/PCountryDropdown.astro" ]; then
    mv src/components/PCountryDropdown.astro src/components/ui/Dropdown/ProjectCountryDropdown.astro
    echo -e "${GREEN}    ✓ ProjectCountryDropdown${NC}"
fi

if [ -f "src/components/PLocaleDropdown.astro" ]; then
    mv src/components/PLocaleDropdown.astro src/components/ui/Dropdown/ProjectLocaleDropdown.astro
    echo -e "${GREEN}    ✓ ProjectLocaleDropdown${NC}"
fi

if [ -f "src/components/SCountryDropdown.astro" ]; then
    mv src/components/SCountryDropdown.astro src/components/ui/Dropdown/StayCountryDropdown.astro
    echo -e "${GREEN}    ✓ StayCountryDropdown${NC}"
fi

if [ -f "src/components/SLocaleDropdown.astro" ]; then
    mv src/components/SLocaleDropdown.astro src/components/ui/Dropdown/StayLocaleDropdown.astro
    echo -e "${GREEN}    ✓ StayLocaleDropdown${NC}"
fi

# 2.1 UI Components - Images
echo "  → Moving image components..."
if [ -f "src/components/ResponsiveImage.astro" ]; then
    mv src/components/ResponsiveImage.astro src/components/ui/Image/ResponsiveImage.astro
    echo -e "${GREEN}    ✓ ResponsiveImage${NC}"
fi

if [ -f "src/components/ResponsiveImageWithSkeleton.astro" ]; then
    mv src/components/ResponsiveImageWithSkeleton.astro src/components/ui/Image/ResponsiveImageWithSkeleton.astro
    echo -e "${GREEN}    ✓ ResponsiveImageWithSkeleton${NC}"
fi

# 2.2 Layout Components
echo "  → Moving layout components..."
if [ -f "src/components/Header.astro" ]; then
    mv src/components/Header.astro src/components/layout/Header.astro
    echo -e "${GREEN}    ✓ Header${NC}"
fi

if [ -f "src/components/HeaderLink.astro" ]; then
    mv src/components/HeaderLink.astro src/components/layout/HeaderLink.astro
    echo -e "${GREEN}    ✓ HeaderLink${NC}"
fi

if [ -f "src/components/Footer.astro" ]; then
    mv src/components/Footer.astro src/components/layout/Footer.astro
    echo -e "${GREEN}    ✓ Footer${NC}"
fi

if [ -f "src/components/BaseHead.astro" ]; then
    mv src/components/BaseHead.astro src/components/layout/BaseHead.astro
    echo -e "${GREEN}    ✓ BaseHead${NC}"
fi

# 2.3 Content Components
echo "  → Moving content components..."
if [ -f "src/components/PostCard.astro" ]; then
    mv src/components/PostCard.astro src/components/content/PostCard.astro
    echo -e "${GREEN}    ✓ PostCard${NC}"
fi

if [ -f "src/components/ProjectCard.astro" ]; then
    mv src/components/ProjectCard.astro src/components/content/ProjectCard.astro
    echo -e "${GREEN}    ✓ ProjectCard${NC}"
fi

if [ -f "src/components/StayCard.astro" ]; then
    mv src/components/StayCard.astro src/components/content/StayCard.astro
    echo -e "${GREEN}    ✓ StayCard${NC}"
fi

if [ -f "src/components/ProjectsToolbar.astro" ]; then
    mv src/components/ProjectsToolbar.astro src/components/content/ProjectsToolbar.astro
    echo -e "${GREEN}    ✓ ProjectsToolbar${NC}"
fi

if [ -f "src/components/FormattedDate.astro" ]; then
    mv src/components/FormattedDate.astro src/components/content/FormattedDate.astro
    echo -e "${GREEN}    ✓ FormattedDate${NC}"
fi

# 2.4 Section Components
echo "  → Moving section components..."
if [ -f "src/components/Homepage/HomeHero.astro" ]; then
    mv src/components/Homepage/HomeHero.astro src/components/sections/HomeHero.astro
    echo -e "${GREEN}    ✓ HomeHero${NC}"
fi

if [ -f "src/components/Homepage/LatestPosts.astro" ]; then
    mv src/components/Homepage/LatestPosts.astro src/components/sections/LatestPosts.astro
    echo -e "${GREEN}    ✓ LatestPosts${NC}"
fi

if [ -f "src/components/Homepage/LatestProjects.astro" ]; then
    mv src/components/Homepage/LatestProjects.astro src/components/sections/LatestProjects.astro
    echo -e "${GREEN}    ✓ LatestProjects${NC}"
fi

if [ -f "src/components/Homepage/LatestStays.astro" ]; then
    mv src/components/Homepage/LatestStays.astro src/components/sections/LatestStays.astro
    echo -e "${GREEN}    ✓ LatestStays${NC}"
fi

if [ -f "src/components/Projects/SupportBox.astro" ]; then
    mv src/components/Projects/SupportBox.astro src/components/sections/SupportBox.astro
    echo -e "${GREEN}    ✓ SupportBox${NC}"
fi

# Remove empty directories
if [ -d "src/components/Homepage" ] && [ -z "$(ls -A src/components/Homepage)" ]; then
    rmdir src/components/Homepage
fi

if [ -d "src/components/Projects" ] && [ -z "$(ls -A src/components/Projects)" ]; then
    rmdir src/components/Projects
fi

# 2.5 Feature Components
echo "  → Moving feature components..."
if [ -f "src/components/Save/SaveToList.astro" ]; then
    mv src/components/Save/SaveToList.astro src/components/features/save/SaveToList.astro
    echo -e "${GREEN}    ✓ SaveToList${NC}"
fi

if [ -f "src/components/Save/saveToList.client.js" ]; then
    mv src/components/Save/saveToList.client.js src/components/features/save/saveToList.client.js
    echo -e "${GREEN}    ✓ saveToList.client.js${NC}"
fi


if [ -f "src/components/Popups/SubscribeDrawer.astro" ]; then
    mv src/components/Popups/SubscribeDrawer.astro src/components/features/popups/SubscribeDrawer.astro
    echo -e "${GREEN}    ✓ SubscribeDrawer${NC}"
fi

if [ -f "src/components/Announcement.astro" ]; then
    mv src/components/Announcement.astro src/components/features/popups/Announcement.astro
    echo -e "${GREEN}    ✓ Announcement${NC}"
fi

# Remove empty directories
if [ -d "src/components/Save" ] && [ -z "$(ls -A src/components/Save)" ]; then
    rmdir src/components/Save
fi

if [ -d "src/components/Ads" ] && [ -z "$(ls -A src/components/Ads)" ]; then
    rmdir src/components/Ads
fi

if [ -d "src/components/Popups" ] && [ -z "$(ls -A src/components/Popups)" ]; then
    rmdir src/components/Popups
fi

# 2.6 Utility Components
echo "  → Moving utility components..."
if [ -f "src/components/Analytics.astro" ]; then
    mv src/components/Analytics.astro src/components/utility/Analytics.astro
    echo -e "${GREEN}    ✓ Analytics${NC}"
fi

if [ -f "src/components/TestListsClient.astro" ]; then
    mv src/components/TestListsClient.astro src/components/utility/TestListsClient.astro
    echo -e "${GREEN}    ✓ TestListsClient${NC}"
fi

echo ""
echo -e "${GREEN}✅ Phase 2 Complete: All components moved${NC}"
echo ""

echo "Phase 3: Next Steps (Manual)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  You now need to update import paths throughout your codebase.${NC}"
echo ""
echo "Recommended approach using VS Code:"
echo "  1. Press Cmd+Shift+F to open global search"
echo "  2. Use the search/replace patterns from COMPONENT-MIGRATION-PLAN.md"
echo ""
echo "Or use these grep commands to find imports:"
echo "  grep -r \"from.*components/Header\" src/"
echo "  grep -r \"from.*components/Footer\" src/"
echo "  grep -r \"from.*components/BaseHead\" src/"
echo ""
echo "Key files to check:"
echo "  • src/layouts/MainLayout.astro"
echo "  • src/pages/index.astro"
echo "  • src/pages/_blog/*.astro"
echo "  • src/pages/projects/*.astro"
echo "  • src/pages/stays/*.astro"
echo ""
echo -e "${YELLOW}After updating imports, test with:${NC}"
echo "  npm run dev"
echo "  npm run build"
echo ""
echo -e "${GREEN}Migration script complete! 🎉${NC}"
echo "See COMPONENT-MIGRATION-PLAN.md for detailed next steps."
