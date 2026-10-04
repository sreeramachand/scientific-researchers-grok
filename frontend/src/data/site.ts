export const site = {
  name: "Scientific Researchers",
  tagline: "Publication and research across biomedical AI, visual science, and cancer.",
  description:
    "Scientific Researchers is a publication and research company. We publish computational and clinical papers, host community STEAM programs, run professional development, and administer research awards.",
  url: "https://scientificresearchers.org",
  email: "hello@scientificresearchers.org",
};

export const pricing = [
  {
    id: "free",
    name: "Free",
    price: 0,
    cadence: "always",
    description: "Open abstracts, community programs, awards, and professional-development pages.",
    features: [
      "Full access to Community Services",
      "Professional Development articles, posters, and webinars",
      "Awards nomination materials and FAQ",
      "Paper abstracts and methods summaries",
    ],
    cta: "Browse open research",
    href: "/community",
    highlighted: false,
  },
  {
    id: "paper",
    name: "Individual paper",
    price: 29,
    cadence: "one-time",
    description: "Unlock a single paywalled PDF. Yours to revisit from your account.",
    features: [
      "Full PDF for one project paper",
      "Figures, tables, and supplements",
      "Receipt kept with your account",
      "No subscription required",
    ],
    cta: "Choose a paper",
    href: "/projects",
    highlighted: false,
  },
  {
    id: "researcher",
    name: "Researcher",
    price: 19,
    cadence: "month",
    description: "A monthly subscription for active readers who follow several project papers.",
    features: [
      "All current project PDFs",
      "New papers added during the term",
      "Webinar archive links",
      "Cancel anytime",
    ],
    cta: "Request monthly plan",
    href: "/contact",
    highlighted: true,
  },
  {
    id: "lab",
    name: "Lab",
    price: 149,
    cadence: "year",
    description: "Annual lab access for groups that need the full project catalog and receipts.",
    features: [
      "Everything in Researcher",
      "Shared lab entitlement (up to 8 seats)",
      "Priority poster and webinar notices",
      "Annual invoice-friendly receipt",
    ],
    cta: "Request annual plan",
    href: "/contact",
    highlighted: false,
  },
] as const;

export const faqs = [
  {
    q: "Who can be nominated for an award?",
    a: "Students, postdoctoral researchers, staff scientists, and community educators may be nominated if their work sits in a listed subject domain and the nominator can speak to impact. Self-nominations are allowed for Early Investigator and Community STEAM.",
  },
  {
    q: "Is there a nomination fee?",
    a: "No. Award nominations are free. Project paper PDFs are the only paid content on this site.",
  },
  {
    q: "When are winners announced?",
    a: "Each cycle publishes a shortlist, then winners, on the Awards page. Recipients are invited to a webinar and may deposit a poster in Professional Development.",
  },
  {
    q: "Can a lab submit more than one nomination?",
    a: "Yes. A lab may submit one nomination per category per cycle. The same person cannot win two categories in the same year.",
  },
  {
    q: "Do you accept institutional letters as PDFs?",
    a: "Yes. Upload institutional letters in the nomination form. Do not email sensitive recommendation letters to the public contact inbox.",
  },
];
