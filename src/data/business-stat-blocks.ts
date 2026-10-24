/**
 * Stat blocks shown on the /for-businesses/ hero.
 *
 * These mirror the homepage's hero stats so the marketing surface
 * is consistent across pages. Update both if the underlying numbers change.
 */
export interface StatBlock {
  label: string;
  value: string;
  caption: string;
}

export const businessStats: StatBlock[] = [
  {
    label: "Listings",
    value: "400+",
    caption: "Projects, stays and tours in the directory",
  },
  {
    label: "Countries",
    value: "60+",
    caption: "Across six continents",
  },
  {
    label: "Impact Areas",
    value: "10+",
    caption: "Animal welfare, climate, community and more",
  },
];
