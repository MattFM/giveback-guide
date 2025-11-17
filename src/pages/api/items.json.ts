import { getCollection } from 'astro:content';
export const prerender = true;

type ItemType = 'project' | 'stay';

type ItemIndexEntry = {
  type: ItemType;
  id: string; // primary id used by SaveToList (pID||pSlug, sID||sSlug)
  altIds: string[]; // other ids that may have been saved historically
  title: string;
  slug: string;
  url: string;
  image?: string | null;
  location?: string | null; // locale and country combined
};

export async function GET() {
  const projects = await getCollection('projects');
  const stays = await getCollection('stays');

  const items: ItemIndexEntry[] = [];

  for (const p of projects) {
    const props: any = p.data.properties;
    const slug = String(props.pSlug || '').trim();
    const pID = (props.pID ?? '').toString().trim();
    const id = pID || slug;
    if (!id || !slug) continue;
    
    // Build location string
    const locale = props.pLocale || '';
    const country = props.pCountry || '';
    let location = null;
    if (locale && country) {
      location = `${locale}, ${country}`;
    } else if (locale) {
      location = locale;
    } else if (country) {
      location = country;
    }
    
    items.push({
      type: 'project',
      id,
      altIds: pID && slug ? [pID, slug].filter((v) => v !== id) : [],
      title: props.pOrganiser || props.pTitle || slug,
      slug,
      url: `/projects/${slug}`,
      image: props.pImageURL || null,
      location,
    });
  }

  for (const s of stays) {
    const props: any = s.data.properties;
    const slug = String(props.sSlug || '').trim();
    const sID = (props.sID ?? '').toString().trim();
    const id = sID || slug;
    if (!id || !slug) continue;
    
    // Build location string
    const locale = props.sLocale || '';
    const country = props.sCountry || '';
    let location = null;
    if (locale && country) {
      location = `${locale}, ${country}`;
    } else if (locale) {
      location = locale;
    } else if (country) {
      location = country;
    }
    
    items.push({
      type: 'stay',
      id,
      altIds: sID && slug ? [sID, slug].filter((v) => v !== id) : [],
      title: props.sName || props.sTitle || slug,
      slug,
      url: `/stays/${slug}`,
      image: props.sImageURL1 || props.sImageURL2 || props.sImageURL3 || null,
      location,
    });
  }

  // Mark as cacheable (static content). Browsers can cache; update when site rebuilds.
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
