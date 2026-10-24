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
    title: "One direct website link",
    description:
      "Point travellers straight to your booking or website from your listing.",
  },
  {
    title: "Description",
    description:
      "Plain-text summary of what you do and why it matters.",
  },
  {
    title: "Location info",
    description:
      "Country and locale, so travellers planning trips can find you by region.",
  },
  {
    title: "Relevant Impact Areas",
    description:
      "The positive-impact categories your business satisfies, with proof.",
  },
  {
    title: "Google Maps link",
    description: "Direct map link so travellers can locate you quickly.",
  },
  {
    title: "Instagram link",
    description: "Connect with travellers who want to follow your work.",
  },
];
