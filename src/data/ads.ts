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
    id: "guruwalk",
    title: "GuruWalk",
    businessName: "GuruWalk",
    url: "https://www.guruwalk.com/?ref=6t6xmbiywasbdh3rzks8",
    cta: "Browse tours",
    description:
      "The world's best free walking tours and activities are right here.",
    weight: 5,
    startDate: "2026-01-01",
    endDate: "2027-12-31",
  },
  {
    id: "give-back-guide-bookshop",
    title: "Give Back Guide Bookshop",
    businessName: "Give Back Guide Bookshop",
    url: "https://uk.bookshop.org/shop/givebackguide",
    cta: "Browse books",
    description:
      "Read wonderful, inspiring and creative books to bring about positive change to you and the planet.",
    weight: 5,
    startDate: "2026-01-01",
    endDate: "2027-12-31",
  },
  {
    id: "byway",
    title: "Byway: Travel through, not over",
    businessName: "Byway",
    url: "https://www.tkqlhce.com/click-101928210-16966827",
    cta: "Browse trips",
    description:
      "Train trips across Europe supported by no-fly travel experts. We're here to make slow travel mainstream.",
    weight: 5,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
];

/**
 * End of the UTC day for a `YYYY-MM-DD` date.
 *
 * `new Date("2027-12-31")` is midnight at the *start* of the day, which made
 * ads disappear a day early. Campaign end dates are inclusive.
 */
function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Filter ads to only those active between startDate and endDate.
 * Uses the provided reference date, or the current date.
 *
 * Called with the build date during static rendering and with the current
 * date again in the browser, so campaigns can start and stop between builds.
 */
export function getActiveAds(
  ads: TextAd[],
  referenceDate: Date = new Date(),
): TextAd[] {
  return ads.filter((ad) => {
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    return referenceDate >= start && referenceDate <= endOfDay(end);
  });
}

/**
 * Stable 32-bit hash (FNV-1a) used to seed build-time ad selection.
 *
 * Hashing the pathname keeps builds reproducible: the same page gets the same
 * ad until the inventory changes, while different pages get different ads.
 */
export function hashKey(key: string): number {
  let hash = 2166136261;

  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Pick an ad with a weighted random draw.
 *
 * Pass `hashKey(...) / 2 ** 32` for a deterministic build-time choice, or
 * `Math.random()` for a fresh choice in the browser. `random` must be in the
 * range [0, 1).
 */
export function pickWeightedAd(
  ads: TextAd[],
  random: number,
): TextAd | null {
  if (ads.length === 0) return null;

  const eligible = ads.filter((ad) => ad.weight > 0);
  if (eligible.length === 0) return ads[0] ?? null;

  const totalWeight = eligible.reduce((sum, ad) => sum + ad.weight, 0);
  const safeRandom = Math.min(Math.max(random, 0), 0.999999999);
  let ticket = safeRandom * totalWeight;

  for (const ad of eligible) {
    ticket -= ad.weight;
    if (ticket < 0) return ad;
  }

  return eligible[eligible.length - 1] ?? null;
}

/**
 * Business name to show alongside the "Ad" badge.
 *
 * Hidden when the title already names the business, so "Byway: Travel through,
 * not over" does not read "Ad Byway Byway: …".
 */
export function getSponsorLabel(
  ad: Pick<TextAd, "title" | "businessName">,
): string {
  const business = ad.businessName.trim();
  if (!business) return "";
  return ad.title.toLowerCase().startsWith(business.toLowerCase())
    ? ""
    : business;
}

let hasValidatedAds = false;

/**
 * Warn about inventory mistakes that would otherwise fail silently.
 * Runs once per module evaluation, so it does not spam dev or build logs.
 */
export function validateAds(ads: TextAd[]): void {
  if (hasValidatedAds) return;
  hasValidatedAds = true;

  const ids = new Set<string>();

  for (const ad of ads) {
    if (ids.has(ad.id)) {
      console.warn(`[ads] Duplicate ad id "${ad.id}".`);
    }
    ids.add(ad.id);

    if (!ad.title || !ad.description || !ad.cta) {
      console.warn(
        `[ads] Ad "${ad.id}" is missing a title, description or CTA.`,
      );
    }

    if (!/^https:\/\//.test(ad.url)) {
      console.warn(`[ads] Ad "${ad.id}" should use an https URL.`);
    }

    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      console.warn(`[ads] Ad "${ad.id}" has an invalid start or end date.`);
    } else if (start > end) {
      console.warn(`[ads] Ad "${ad.id}" starts after it ends.`);
    }

    if (ad.weight <= 0) {
      console.warn(`[ads] Ad "${ad.id}" has a non-positive weight.`);
    }
  }
}
