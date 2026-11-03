/**
 * Data points included in a free directory listing.
 *
 * Drives the "Your free listing includes…" panel on the /for-businesses/
 * marketing page. Each item describes one editable field on a listing.
 *
 * Keep this in sync with the Notion data model exposed in
 * `src/content.config.ts` (the `p*` and `s*` property names).
 */
export interface ListingInclude {
  title: string;
  description: string;
}

export const listingIncludes: ListingInclude[] = [
  {
    title: "A link to your website",
    description:
      "Get our users straight to where they need to be.",
  },
  {
    title: "Description",
    description:
      "Summary of what you do, your impact and how users can engage.",
  },
  {
    title: "Location",
    description:
      "City and country info, plus indigenous names and endonyms.",
  },
  {
    title: "Impact Areas",
    description:
      "Core to our directory, the positive-impact categories your business satisfies",
  },
  {
    title: "Google Maps link",
    description: "Direct map link so travellers can locate you quickly.",
  },
  {
    title: "Instagram link",
    description: "Connect with travellers who want to follow what you do.",
  },
];
