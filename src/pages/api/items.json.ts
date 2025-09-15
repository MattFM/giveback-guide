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
    items.push({
      type: 'project',
      id,
      altIds: pID && slug ? [pID, slug].filter((v) => v !== id) : [],
      title: props.pTitle || props.pOrganiser || slug,
      slug,
      url: `/projects/${slug}`,
      image: props.pImageURL || null,
    });
  }

  for (const s of stays) {
    const props: any = s.data.properties;
    const slug = String(props.sSlug || '').trim();
    const sID = (props.sID ?? '').toString().trim();
    const id = sID || slug;
    if (!id || !slug) continue;
    items.push({
      type: 'stay',
      id,
      altIds: sID && slug ? [sID, slug].filter((v) => v !== id) : [],
      title: props.sTitle || props.sName || slug,
      slug,
      url: `/stays/${slug}`,
      image: props.sImageURL1 || props.sImageURL2 || props.sImageURL3 || null,
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
