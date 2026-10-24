/**
 * Pricing tiers for the /for-businesses/ marketing page.
 *
 * Single source of truth for the listing-pricing surface on the site and
 * (later) for the account-dashboard billing flow. Keep the data here
 * inline with what we actually offer; do not duplicate tier definitions
 * across components.
 *
 * Tiers flagged `comingSoon: true` are not yet purchasable — the UI
 * must surface this so visitors aren't promised something that isn't
 * wired up yet.
 */
export interface PricingTier {
  /** Stable identifier — used as a React-style key and as billing lookup later. */
  id: "free" | "featured" | "bespoke";
  /** Headline name shown on the card. */
  name: string;
  /** Short subtitle shown beneath the name. */
  tagline: string;
  /** One-paragraph description. */
  description: string;
  /** Bullet list of features (rendered as a checklist). First bullet may be an "Everything in X, plus:" preamble. */
  features: string[];
  /** Call to action. */
  cta: { label: string; href: string };
  /** Visual emphasis on the card (e.g. ring, larger shadow). */
  highlighted?: boolean;
  /** Mark a tier as not yet purchasable — UI shows a "Coming soon" notice. */
  comingSoon?: boolean;

  /** Displayed price (used when only one period is offered, e.g. Free or Bespoke). */
  price: string;
  /** Displayed suffix (e.g. "/month", "/year"). */
  priceSuffix?: string;

  /**
   * Optional billing variants. When present the marketing surface
   * renders a monthly/yearly toggle that picks between these.
   */
  variants?: Array<{
    period: "monthly" | "yearly";
    price: string;
    priceSuffix?: string;
    /** Explanatory line shown beneath the price, e.g. "Billed yearly — save £10". */
    billedNote?: string;
  }>;
}

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free Listing",
    tagline: "Get discovered",
    description:
      "Everything a traveller needs to find and engage with your business. Always free, always included.",
    price: "Free",
    priceSuffix: "forever",
    features: [
      "One direct website link",
      "Description of what you do and why it matters",
      "Country and locale for trip-planning",
      "Relevant Impact Areas with proof",
      "Google Maps link",
      "Instagram link",
    ],
    cta: { label: "Get listed for free", href: "/for-businesses/submit/" },
  },

  {
    id: "featured",
    name: "Featured Listing",
    tagline: "Stand out from the crowd",
    description:
      "Greater visibility across the directory — badged, prioritised in search and showcased on relevant landing pages.",
    price: "£5",
    priceSuffix: "/month",
    variants: [
      {
        period: "monthly",
        price: "£5",
        priceSuffix: "/month",
        billedNote: "Billed monthly",
      },
      {
        period: "yearly",
        price: "£50",
        priceSuffix: "/year",
        billedNote: "Billed yearly — save £10",
      },
    ],
    features: [
      "Everything in Free, plus:",
      "‘Featured Partner’ badge on your listing",
      "Prioritised placement in search results",
      "Featured on relevant landing pages",
      "Newsletter mention each quarter",
      "Priority support",
    ],
    highlighted: true,
    comingSoon: true,
    cta: {
      label: "Discuss a partnership",
      href: "/for-businesses/contact/",
    },
  },

  {
    id: "bespoke",
    name: "Bespoke Partnership",
    tagline: "A tailored arrangement",
    description:
      "For businesses wanting a fuller partnership — co-created social content, an on-site visit and dedicated editorial support.",
    price: "Custom",
    priceSuffix: "on request",
    features: [
      "Everything in Featured, plus:",
      "On-site verification visit",
      "Co-created social media content",
      "Editorial features in our blog",
      "Direct account management",
    ],
    comingSoon: true,
    cta: {
      label: "Discuss a partnership",
      href: "/for-businesses/contact/",
    },
  },
];
