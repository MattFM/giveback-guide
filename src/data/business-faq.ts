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
    answerHTML: `Yes, and it always will be. Give Back Guide is a mission-driven non-profit and the directory exists to platform social enterprises and community projects. You only pay if you want to upgrade to <a href="/for-businesses/contact/">Featured</a> or commission a Bespoke arrangement. Choosing one of our paid options also helps to keep our platform running.`,
  },
  {
    question: "Which Impact Areas can I list under?",
    answerHTML: `We currently have 19 Impact Areas including animal welfare, biodiversity, climate and community. To be included, your business must satisfy at least one of these and be able to provide proof on request. See our <a href="/about/impacts/">Impact Areas</a> page for the full list.`,
  },
  {
    question: "How long does verification take?",
    answerHTML: `Most submissions are verified within two to four weeks. We review each listing manually against our criteria and may follow up if we need additional information. Timeframes vary depending on how quickly documentation is provided.`,
  },
  {
    question: "Can I list multiple businesses?",
    answerHTML: `Yes. Each business needs its own listing and its own submission.`,
  },
  {
    question: "What is the difference between Featured and Bespoke?",
    answerHTML: `<strong>Featured</strong> is a fixed-price subscription that gives your listing greater visibility across the directory. <strong>Bespoke</strong> is a custom arrangement for businesses wanting a closer partnership with us. If you want more than the 'Featured' tier provides, you want a Bespoke arrangement.`,
  },
  {
    question: "When will Featured subscriptions go live?",
    answerHTML: `We're finalising the checkout flow now. If you'd like to be notified when it opens, <a href="/for-businesses/contact/">get in touch</a> and we'll let you know.`,
  },
  {
    question: "What is the difference between 'listings' and 'advertising'?",
    answerHTML: `Listings and advertising are two separate offerings. A listing is a permanent entry in our directory; travellers find you by browsing and searching. Advertising is text-based ad placements across the site, best for short campaigns and aimed at any ethical business (not just businesses that qualify for placement in our directory). <a href="/for-businesses/advertising/">View advertising options</a>.`,
  },
];
