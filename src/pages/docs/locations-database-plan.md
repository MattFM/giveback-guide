---
layout: ../../layouts/DocsLayout.astro
title: Locations Database Implementation Plan
description: Architecture plan for restructuring location data using a centralized Locations database shared between Projects and Stays collections
---

# Locations Database Implementation Plan

**Date:** 12 November 2025  
**Status:** Planning Phase

## Overview

Restructure location data to use a centralized Locations database in Notion, shared between Projects and Stays collections. This enables:
- Perfect city-region pairing
- Consistent location naming across collections
- Foundation for future mapping features
- Clean URL generation without location mismatches

## Architecture Decision: Hybrid Coordinate Approach

### Location Coordinates
**City/region-level coordinates** → Stored in Locations database
- Used for: Location overview pages, region maps, general positioning
- Example: Brighton city center, East Sussex centroid

**Project/stay-specific coordinates** → Stored in Projects/Stays databases
- Used for: Individual project pins on maps
- Example: Specific sanctuary address within Brighton
- Prevents multiple projects showing as single pin in cities like London

## Notion Database Structure

### 1. Locations Database (New)

**Purpose:** Central registry of all geographic locations

| Field Name | Type | Purpose | Example |
|------------|------|---------|---------|
| **Name** | Title | Human-readable identifier | "Brighton, East Sussex, England" |
| **City** | Text | City/town/village name (optional) | "Brighton" |
| **Region** | Text | County/state/island (optional) | "East Sussex" |
| **Country** | Select | Country name | "England" |
| **Latitude** | Number | City/region center point | 50.8225 |
| **Longitude** | Number | City/region center point | -0.1372 |
| **Type** | Select | Location type | "City" or "Region" |
| **Slug** | Text | URL-friendly identifier | "brighton" |
| **Status** | Select | Publication status | "Published" |

**Field Rules:**
- At least one of `City` or `Region` must be populated
- If `Type = "City"`, then `City` field is required
- If `Type = "Region"`, then `Region` field is required
- `Slug` should be unique within each country

**Example Entries:**

```
Name: "Brighton, East Sussex, England"
City: Brighton
Region: East Sussex
Country: England
Latitude: 50.8225
Longitude: -0.1372
Type: City
Slug: brighton
Status: Published

---

Name: "East Sussex, England"
City: [empty]
Region: East Sussex
Country: England
Latitude: 50.9097
Longitude: 0.2489
Type: Region
Slug: east-sussex
Status: Published

---

Name: "Gozo, Malta"
City: [empty]
Region: Gozo
Country: Malta
Latitude: 36.0444
Longitude: 14.2406
Type: Region
Slug: gozo
Status: Published

---

Name: "London, Greater London, England"
City: London
Region: Greater London
Country: England
Latitude: 51.5074
Longitude: -0.1278
Type: City
Slug: london
Status: Published
```

### 2. Projects Database (Updated)

**New/Modified Fields:**

| Field Name | Type | Purpose | Change |
|------------|------|---------|--------|
| **pLocations** | Relation → Locations | Link to location entries | NEW |
| **pLatitude** | Number | Specific project location | NEW |
| **pLongitude** | Number | Specific project location | NEW |
| ~~pLocale~~ | ~~Multi-select~~ | ~~Combined city/region~~ | REMOVE |
| ~~pCity~~ | ~~Multi-select~~ | ~~Cities~~ | DON'T CREATE |
| ~~pRegion~~ | ~~Multi-select~~ | ~~Regions~~ | DON'T CREATE |

**Why project-specific coordinates:**
- Each project has unique address/GPS location
- Prevents overlapping pins in dense cities
- Enables precise "Navigate Here" functionality
- Can still fall back to location coordinates if not set

### 3. Stays Database (Updated)

**New/Modified Fields:**

| Field Name | Type | Purpose | Change |
|------------|------|---------|--------|
| **sLocations** | Relation → Locations | Link to location entries | NEW |
| **sLatitude** | Number | Specific stay location | NEW |
| **sLongitude** | Number | Specific stay location | NEW |
| ~~sLocale~~ | ~~Multi-select~~ | ~~Combined city/region~~ | REMOVE |

## Display Logic

### Cards (ProjectCard, StayCard)

**Show cities first, fall back to regions:**

```typescript
const displayLocation = locations
  .map(loc => loc.city || loc.region)
  .join(' & ');

// Result: "Brighton & London"
// or: "Gozo & Azores" (regions only)
```

### Project/Stay Pages (ProjectMetadata, StayMetadata)

**Format based on location data:**

**Single city + region:**
```
Org is a [Type] in [Brighton] in [East Sussex], [England].
```

**Multiple locations:**
```
Org is a [Type] in [Brighton] & [London] in [East Sussex] & [Greater London], [England].
```

**Region only:**
```
Org is a [Type] in [Gozo], [Malta].
```

**City only:**
```
Org is a [Type] in [Brighton], [England].
```

### Clickable Pills Link To:
- **City pills** → `/projects/{country}/{city-slug}`
- **Region pills** → `/projects/{country}/areas/{region-slug}`
- **Country pills** → `/projects/{country}`

## URL Structure

### Routes Generated

```
/projects/england/brighton               # City page (all projects in Brighton)
/projects/england/areas/east-sussex      # Region page (all projects in East Sussex)
/projects/malta/areas/gozo               # Region page (island)
/projects/portugal/areas/azores          # Region page (archipelago)
```

**Why `/areas/` prefix:**
- Universal term (works for states, counties, islands, provinces)
- Prevents namespace collision between city and region names
- Clear semantic meaning
- Shorter than `/regions/`

### Route Generation Logic

```typescript
// City routes
locations
  .filter(loc => loc.type === 'City')
  .forEach(loc => {
    routes.push(`/projects/${loc.country}/${loc.slug}`);
  });

// Region routes
locations
  .filter(loc => loc.type === 'Region')
  .forEach(loc => {
    routes.push(`/projects/${loc.country}/areas/${loc.slug}`);
  });
```

## Mapping Features (Future)

### Location Overview Pages
Show map with pins for all projects in that location:
```typescript
<Map
  center={[location.latitude, location.longitude]}
  zoom={12}
  markers={projects.map(p => ({
    lat: p.pLatitude || location.latitude,  // Project-specific or location default
    lng: p.pLongitude || location.longitude,
    title: p.pTitle,
    url: `/projects/${p.pSlug}`
  }))}
/>
```

### Individual Project Pages
Show single pin at project's exact location:
```typescript
<Map
  center={[project.pLatitude, project.pLongitude]}
  zoom={15}
  markers={[{
    lat: project.pLatitude,
    lng: project.pLongitude,
    title: project.pTitle
  }]}
/>
```

### All Projects Map
Show all projects across all locations:
```typescript
<Map
  markers={projects
    .filter(p => p.pLatitude && p.pLongitude)
    .map(p => ({
      lat: p.pLatitude,
      lng: p.pLongitude,
      title: p.pTitle,
      url: `/projects/${p.pSlug}`
    }))
  }
/>
```

## Implementation Steps

### Phase 1: Setup Locations Database in Notion

**Step 1.1: Create Database**
1. In Notion, create new database: "Locations"
2. Add fields as specified in structure above
3. Set up filters: `Status = "Published"`

**Step 1.2: Populate Initial Data**
1. Export existing `pLocale` values from Projects
2. Export existing `sLocale` values from Stays
3. Create unique list of all locations
4. Create entry for each location in new database
5. Categorize each as "City" or "Region"
6. Add coordinates (see geocoding section below)

**Step 1.3: Add Relations in Projects/Stays**
1. In Projects database, add new field: `pLocations` (Relation → Locations)
2. In Stays database, add new field: `sLocations` (Relation → Locations)
3. Manually link each project/stay to appropriate location(s)
4. Add `pLatitude` and `pLongitude` number fields to Projects
5. Add `sLatitude` and `sLongitude` number fields to Stays

### Phase 2: Update Astro Configuration

**Step 2.1: Add Locations Collection** (`content.config.ts`)
```typescript
const locations = defineCollection({
  loader: notionLoader({
    auth: getEnvVar('NOTION_TOKEN'),
    database_id: getEnvVar('LOCATIONS_NOTION_DATABASE_ID'),
    filter: {
      property: 'Status',
      select: { "equals": "Published" },
    },
  }),
  schema: notionPageSchema({
    properties: z.object({
      lName: transformedPropertySchema.title,
      lCity: transformedPropertySchema.rich_text,
      lRegion: transformedPropertySchema.rich_text,
      lCountry: transformedPropertySchema.select,
      lLatitude: transformedPropertySchema.number,
      lLongitude: transformedPropertySchema.number,
      lType: transformedPropertySchema.select,
      lSlug: transformedPropertySchema.rich_text,
    }),
  }),
});
```

**Step 2.2: Update Projects/Stays Schemas**
```typescript
// In projects schema:
pLocations: propertySchema.relation.optional(),
pLatitude: transformedPropertySchema.number.optional(),
pLongitude: transformedPropertySchema.number.optional(),

// In stays schema:
sLocations: propertySchema.relation.optional(),
sLatitude: transformedPropertySchema.number.optional(),
sLongitude: transformedPropertySchema.number.optional(),
```

**Step 2.3: Add Environment Variable**
```bash
# .env
LOCATIONS_NOTION_DATABASE_ID=your-database-id-here
```

**Step 2.4: Create Location Enrichment Helper** (`src/lib/locations.ts`)
```typescript
import { getEntry } from 'astro:content';

export async function enrichLocations(locationIds: string[]) {
  if (!locationIds || locationIds.length === 0) return [];
  
  const locations = await Promise.all(
    locationIds.map(async id => {
      try {
        const location = await getEntry('locations', id);
        return location?.data.properties;
      } catch (e) {
        console.warn(`Location ${id} not found`);
        return null;
      }
    })
  );
  
  return locations.filter(Boolean);
}

export function getDisplayLocation(locations: any[]) {
  return locations
    .map(loc => loc.lCity || loc.lRegion)
    .filter(Boolean)
    .join(' & ');
}

export function getCities(locations: any[]) {
  return locations
    .filter(loc => loc.lCity)
    .map(loc => ({ name: loc.lCity, slug: loc.lSlug }));
}

export function getRegions(locations: any[]) {
  return locations
    .filter(loc => loc.lRegion)
    .map(loc => ({ name: loc.lRegion, slug: loc.lSlug }));
}
```

### Phase 3: Update Components

**Step 3.1: Update ProjectCard.astro**
```astro
---
import { enrichLocations, getDisplayLocation } from '@/lib/locations';

const locations = await enrichLocations(project.data.properties.pLocations);
const displayLocation = getDisplayLocation(locations);
---

<p class="text-sm text-gray-400">
  {project.data.properties.pOrganiser} in {displayLocation}
</p>
```

**Step 3.2: Update ProjectMetadata.astro**
```astro
---
interface Props {
  operator?: string;
  types?: string[];
  locations?: any[];  // Enriched location data
  countries?: string[];
  verificationStatus?: boolean;
  isFree?: boolean;
}

const { locations = [] } = Astro.props;

const cities = locations.filter(loc => loc.lCity);
const regions = locations.filter(loc => loc.lRegion);
const countries = [...new Set(locations.map(loc => loc.lCountry))];
---

<!-- Format: "in [City1] & [City2] in [Region1] & [Region2], [Country]" -->
<!-- Cities link to: /projects/{country}/{city-slug} -->
<!-- Regions link to: /projects/{country}/areas/{region-slug} -->
```

**Step 3.3: Update StayCard.astro and StayMetadata.astro**
(Similar changes to project components)

### Phase 4: Update Routes

**Step 4.1: City Routes** (`src/pages/projects/[country]/[city]/[...page].astro`)
```typescript
export async function getStaticPaths() {
  const locations = await getCollection('locations');
  const projects = await getCollection('projects');
  const { enrichLocations } = await import('@/lib/locations');
  
  const cityLocations = locations.filter(
    loc => loc.data.properties.lType === 'City'
  );
  
  const paths = [];
  
  for (const location of cityLocations) {
    const projectsInCity = [];
    
    for (const project of projects) {
      const projectLocations = await enrichLocations(
        project.data.properties.pLocations
      );
      
      if (projectLocations.some(loc => loc.lSlug === location.data.properties.lSlug)) {
        projectsInCity.push(project);
      }
    }
    
    if (projectsInCity.length > 0) {
      const country = location.data.properties.lCountry.toLowerCase().replace(/\s+/g, '-');
      const city = location.data.properties.lSlug;
      
      // Generate paginated routes if needed
      paths.push({
        params: { country, city, page: undefined },
        props: { projects: projectsInCity, location: location.data.properties }
      });
    }
  }
  
  return paths;
}
```

**Step 4.2: Region Routes** (`src/pages/projects/[country]/areas/[region]/[...page].astro`)
(Similar to city routes, but filter by `lType === 'Region'`)

**Step 4.3: Remove Old Locale Routes**
- Delete: `src/pages/projects/[country]/[locale]/[...page].astro`

### Phase 5: Update Dropdowns

**Step 5.1: Update Country Dropdowns**
(No change - still works the same)

**Step 5.2: Create City Dropdown** (`src/components/ui/Dropdown/ProjectCityDropdown.astro`)
```typescript
const locations = await getCollection('locations');
const cities = locations
  .filter(loc => loc.data.properties.lType === 'City')
  .sort((a, b) => a.data.properties.lCity.localeCompare(b.data.properties.lCity));
```

**Step 5.3: Create Region Dropdown** (`src/components/ui/Dropdown/ProjectRegionDropdown.astro`)
```typescript
const locations = await getCollection('locations');
const regions = locations
  .filter(loc => loc.data.properties.lType === 'Region')
  .sort((a, b) => a.data.properties.lRegion.localeCompare(b.data.properties.lRegion));
```

### Phase 6: Testing & Migration

**Step 6.1: Test Build**
```bash
npm run build
```

**Step 6.2: Verify Routes**
- Check that city pages generate correctly
- Check that region pages generate correctly
- Verify no broken links in metadata pills

**Step 6.3: Remove Old Fields**
Once verified working:
- Remove `pLocale` from Projects database in Notion
- Remove `sLocale` from Stays database in Notion
- Clean up any old locale-based route files

## Notion Setup Instructions

### Manual Setup

**1. Create Locations Database:**
- Click "+ New" in Notion
- Select "Database" → "Table"
- Name it "Locations"
- Set up fields as specified in structure table above

**2. Configure Field Types:**
- Name: Already created (Title type)
- City: Click "+", choose "Text", name it "City"
- Region: Click "+", choose "Text", name it "Region"
- Country: Click "+", choose "Select", name it "Country"
- Latitude: Click "+", choose "Number", name it "Latitude"
- Longitude: Click "+", choose "Number", name it "Longitude"
- Type: Click "+", choose "Select", name it "Type", add options: "City", "Region"
- Slug: Click "+", choose "Text", name it "Slug"
- Status: Click "+", choose "Select", name it "Status", add option: "Published"

**3. Add Initial Data:**
- Click "New" to add first location
- Fill in all fields
- For coordinates, use Google Maps (right-click location → see lat/lng)
- For slug, use lowercase, hyphenated version of city/region name

### Using Notion AI to Populate Data

**Prompt for Notion AI (in table view):**

```
I have a list of locations I need to add to this database. For each location, please:
1. Create a new row
2. Set the Name field to: "[City/Region], [Parent Region if applicable], [Country]"
3. Fill in the City field (if it's a city/town)
4. Fill in the Region field (if it's a region/county/state/island)
5. Fill in the Country field
6. Look up and add the Latitude and Longitude coordinates for the location's center point
7. Set Type to "City" if it has a City value, or "Region" if it only has a Region value
8. Generate a URL-friendly slug (lowercase, hyphens instead of spaces)
9. Set Status to "Published"

Here are the locations to add:
[Paste your list of locations from existing pLocale values]
```

**Example location list to paste:**
```
Brighton, East Sussex, England
London, Greater London, England
Gozo, Malta
Azores, Portugal
Edinburgh, Scotland
```

**Note:** Notion AI may not always have accurate coordinates. Verify critical locations manually using Google Maps.

### Geocoding Tips

**For Batch Geocoding:**
1. Export your location list to CSV
2. Use a geocoding service:
   - Google Sheets + Geocoding add-on
   - OpenStreetMap Nominatim API
   - Mapbox Geocoding API
3. Import results back into Notion

**For Individual Locations:**
1. Open Google Maps
2. Search for location
3. Right-click on the pin
4. Select "What's here?"
5. Copy coordinates from bottom panel

## Migration Checklist

- [ ] Create Locations database in Notion
- [ ] Add all required fields with correct types
- [ ] Populate with existing location data
- [ ] Add coordinates to all locations
- [ ] Add pLocations relation field to Projects database
- [ ] Add sLocations relation field to Stays database
- [ ] Add pLatitude/pLongitude fields to Projects
- [ ] Add sLatitude/sLongitude fields to Stays
- [ ] Link all projects to their locations
- [ ] Link all stays to their locations
- [ ] Add LOCATIONS_NOTION_DATABASE_ID to .env
- [ ] Update content.config.ts with locations collection
- [ ] Update projects schema (add pLocations, pLatitude, pLongitude)
- [ ] Update stays schema (add sLocations, sLatitude, sLongitude)
- [ ] Create src/lib/locations.ts helper functions
- [ ] Update ProjectCard.astro
- [ ] Update StayCard.astro
- [ ] Update ProjectMetadata.astro
- [ ] Update StayMetadata.astro
- [ ] Create new city route structure
- [ ] Create new region route structure
- [ ] Update dropdowns for cities and regions
- [ ] Test build locally
- [ ] Verify all routes generate correctly
- [ ] Check for broken links
- [ ] Deploy to staging
- [ ] Verify in production
- [ ] Remove old pLocale field from Projects
- [ ] Remove old sLocale field from Stays
- [ ] Delete old locale route files
- [ ] Update .github/copilot-instructions.md

## Benefits Summary

✅ **Perfect city-region pairing** - No more location mismatches  
✅ **Shared location data** - Single source of truth across Projects and Stays  
✅ **Precise mapping** - Project-specific coordinates prevent overlapping pins  
✅ **Clean URLs** - `/projects/england/brighton` and `/projects/england/areas/east-sussex`  
✅ **SEO-friendly** - Each location gets dedicated, semantic URL  
✅ **Future-proof** - Foundation for mapping, distance calculations, regional filtering  
✅ **Maintainable** - Update location once, affects all content  
✅ **Flexible** - Supports cities, regions, city-only, region-only, and multi-location projects

## Related Files

- `src/content.config.ts` - Schema definitions
- `src/lib/locations.ts` - Location helper functions (to be created)
- `src/components/content/ProjectCard.astro` - Card display
- `src/components/content/ProjectMetadata.astro` - Metadata pills
- `src/components/content/StayCard.astro` - Stay card display
- `src/components/content/StayMetadata.astro` - Stay metadata
- `src/pages/projects/[country]/[city]/[...page].astro` - City routes (to be created)
- `src/pages/projects/[country]/areas/[region]/[...page].astro` - Region routes (to be created)
- `.github/copilot-instructions.md` - Update location references

## Questions & Decisions Log

**Q: Should regions appear in URL path?**  
A: Yes, using `/areas/` prefix to distinguish from cities and prevent namespace collisions.

**Q: Where should coordinates be stored?**  
A: Hybrid approach - location-level coords in Locations DB for overview maps, project-specific coords in Projects DB for precise pins.

**Q: Can Locations DB be shared between Projects and Stays?**  
A: Yes, both use relations to the same Locations database.

**Q: How to handle region-only projects (no specific city)?**  
A: Locations DB supports both - entries can have only Region field populated, Type set to "Region".

**Q: What if a project has multiple locations across different regions?**  
A: Project links to multiple Location entries via relation. Display shows all cities/regions separated. Each generates appropriate route.

**Q: How to display locations in metadata?**  
A: Format: "in [City1] & [City2] in [Region1] & [Region2], [Country]" - makes clear which locations are present without assuming pairing.
