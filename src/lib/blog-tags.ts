export interface BlogTagEntry {
  name: string;
  description: string;
}

export const BLOG_TAGS: BlogTagEntry[] = [
  {
    name: "Travel Guides",
    description: "Discover how to travel regeneratively in destinations all over the world.",
  },
  {
    name: "Travel Advice",
    description: "Learn how to travel sustainably with our top travel advice,",
  },
  {
    name: "News & Updates",
    description: "Latest news and updates on the Give Back Guide platform.",
  },
  {
    name: "The Problem With Travel",
    description: "To fix the tourism industry, we must first understand the problems we are dealing with.",
  }
] as const;

export type BlogTag = (typeof BLOG_TAGS)[number]["name"];

/** Check if a tag string is in the allowed list */
export function isValidBlogTag(tag: string): tag is BlogTag {
  return (BLOG_TAGS.map((t) => t.name) as readonly string[]).includes(tag);
}

/** Filter an array of tags to only valid ones */
export function getValidTags(tags: string[]): BlogTag[] {
  return tags.filter(isValidBlogTag);
}

/** Create a URL slug from a tag name */
export function getTagSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, "-");
}

/** Get the full entry for a tag name */
export function getTagByName(name: string): BlogTagEntry | undefined {
  return BLOG_TAGS.find((t) => t.name === name);
}

/** Get description for a tag name (null if not found) */
export function getTagDescription(name: string): string | null {
  return getTagByName(name)?.description || null;
}
