/**
 * Stats shown on /for-businesses/advertising/. Reuses the StatBlock
 * interface from business-stat-blocks so StatsStrip can render either
 * dataset with the same component.
 *
 * Newsletter subscriber numbers are deliberately omitted — too low to be
 * a compelling advertising selling point at this stage.
 */
import type { StatBlock } from "./business-stat-blocks";

export const advertisingStats: StatBlock[] = [
  {
    label: "Monthly page views",
    value: "4,000+",
    caption: "Across the directory, blog and key landing pages",
  },
  {
    label: "Social followers",
    value: "7,000+",
    caption: "Across Instagram, TikTok, Mastodon, Bluesky and Threads",
  },
];
