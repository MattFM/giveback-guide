/**
 * Frequently-asked questions for the /for-businesses/ FAQ section.
 *
 * Question text is plain. Answer text is an HTML string so we can include
 * inline links to `/about/`, `/for-businesses/contact/`, and other
 * canonical routes without taking on a Markdown pipeline at this layer.
 * Answers are sourced-controlled and rendered through Bearnie components,
 * so any inline anchors inherit the site-wide prose link styling.
 */
export interface FaqItem {
  question: string;
  /** Allow inline HTML for headings, anchors, etc. Source-controlled, not user-input. */
  answerHTML: string;
}

export const businessFaq: FaqItem[] = [
  {
    question: "Is the basic listing really free?",
    answerHTML: `Yes — it always will be. We are a non-profit and the basic directory listing exists specifically to keep the platform accessible to every business that meets our criteria. You only pay if you upgrade to <a href="/for-businesses/contact/">Featured</a> or commission a Bespoke arrangement.`,
  },
  {
    question: "Which Impact Areas can I list under?",
    answerHTML: `We currently have 10+ Impact Areas including animal welfare, biodiversity, climate and community. To be included, your business must satisfy at least one of these and be able to provide proof on request. See our <a href="/about/impacts/">Impact Areas</a> page for the full list.`,
  },
  {
    question: "How long does verification take?",
    answerHTML: `Most submissions are verified within two to four weeks. We review each listing manually against our criteria and may follow up if we need additional evidence. Timeframes vary depending on how quickly documentation is provided.`,
  },
  {
    question: "Can I list multiple businesses?",
    answerHTML: `Yes. Each business needs its own listing and its own submission. There is no limit on how many free listings your organisation can have.`,
  },
  {
    question: "What is the difference between Featured and Bespoke?",
    answerHTML: `<strong>Featured</strong> is a fixed-price subscription that gives your listing greater visibility across the directory. <strong>Bespoke</strong> is a custom arrangement for businesses wanting a fuller partnership — co-created social content, an on-site visit and editorial features. Most businesses only need the Featured tier.`,
  },
  {
    question: "When will Featured subscriptions go live?",
    answerHTML: `We're finalising the checkout flow now. If you'd like to be notified when it opens, <a href="/for-businesses/contact/">get in touch</a> and we'll let you know.`,
  },
  {
    question: "How is this different from advertising?",
    answerHTML: `Listings and advertising are two separate offerings. A listing is a permanent entry in the directory; travellers find you by browsing and searching. Advertising is discrete ad placements across the site — best for short campaigns. <a href="/for-businesses/advertising/">View advertising options</a>.`,
  },
];
