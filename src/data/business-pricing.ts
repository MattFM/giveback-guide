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

/**
 * Master switch for whether monetary amounts are published on the marketing
 * surface. While false, PricingCard replaces the price block on paid tiers
 * with "Pricing to be announced" and PricingSection hides the monthly/yearly
 * toggle. All figures stay in this file, so publishing is a one-line flip.
 */
export const PRICING_PUBLIC = false;

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free Listing",
    tagline: "Get discovered",
    description:
      "Everything a traveller needs to find your business and engage with what you do.",
    price: "Free",
    priceSuffix: "forever",
    features: [
      "Direct website link",
      "Description of what you do and your impact",
      "Location info",
      "Your verified Impact Areas",
      "Google Maps link",
      "Instagram link",
    ],
    cta: { label: "Get listed for free", href: "/for-businesses/submit/" },
  },

  {
    id: "featured",
    name: "Featured Listing",
    tagline: "Get extra visibility",
    description:
      "Get badged, prioritised in search and showcased on relevant landing pages.",
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
      "‘Featured’ badge on your listing",
      "Prioritised placement in search results",
      "Featured on relevant landing pages",
      "Newsletter mention",
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
    tagline: "Tailored arrangements",
    description:
      "For businesses wanting a closer and more involved partnership.",
    price: "Custom",
    priceSuffix: "on request",
    features: [
      "Everything in Featured, plus:",
      "In-person verirication from us",
      "Bespoke social media content",
      "Editorial features in our blog",
      "Newsletter features",
    ],
    comingSoon: true,
    cta: {
      label: "Discuss a partnership",
      href: "/for-businesses/contact/",
    },
  },
];
