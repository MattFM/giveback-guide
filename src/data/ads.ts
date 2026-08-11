export interface TextAd {
  id: string;
  title: string;        // Main headline / brand name
  businessName: string; // Secondary / sponsor name (often same as title)
  url: string;
  cta: string;
  description: string;
  weight: number;
  startDate: string;
  endDate: string;
}

export const ADS: TextAd[] = [
  {
    id: "sample-gyg",
    title: "GetYourGuide",
    businessName: "GetYourGuide",
    url: "https://gyg.me/giveback-guide",
    cta: "Browse tours",
    description:
      "Discover and book unforgettable travel experiences worldwide.",
    weight: 5,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "advertise-here",
    title: "Support Give Back Guide",
    businessName: "Advertise here",
    url: "https://giveback.guide/about/advertising/",
    cta: "Find out more",
    description:
      "Get your brand in front of thoughtful, ethical and sustainably-minded travellers.",
    weight: 3,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "sample-ecolodge",
    title: "EcoStays Alliance",
    businessName: "EcoStays Alliance",
    url: "https://example.com/ecostays",
    cta: "Browse stays",
    description:
      "Hand-picked eco-lodges and sustainable stays where your holiday directly funds conservation and community projects.",
    weight: 2,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
];

/**
 * Filter ads to only those active between startDate and endDate.
 * Uses the provided reference date, or the current date at build time.
 */
export function getActiveAds(
  ads: TextAd[],
  referenceDate: Date = new Date(),
): TextAd[] {
  return ads.filter((ad) => {
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);
    return referenceDate >= start && referenceDate <= end;
  });
}
