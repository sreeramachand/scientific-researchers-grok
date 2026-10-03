export type NavLink = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  href: string;
  items: NavLink[];
};

export const projectGroups: NavGroup[] = [
  {
    label: "Biomedical AI",
    href: "/projects/biomedical-ai",
    items: [
      { label: "Nilearn image paper", href: "/projects/biomedical-ai/nilearn-image-paper" },
      { label: "GBM co-expression networks", href: "/projects/biomedical-ai/gbm-signatures" },
    ],
  },
  {
    label: "Visual",
    href: "/projects/visual",
    items: [
      { label: "Uveal melanoma", href: "/projects/visual/uveal-melanoma" },
      { label: "Diabetic retinopathy", href: "/projects/visual/diabetic-retinopathy" },
    ],
  },
  {
    label: "Cancer",
    href: "/projects/cancer",
    items: [
      { label: "Lung paper", href: "/projects/cancer/lung-paper" },
      { label: "Colon cancer paper", href: "/projects/cancer/colon-cancer-paper" },
    ],
  },
];

export const communityLinks: NavLink[] = [
  { label: "AI/STEAM", href: "/community/ai-steam" },
  { label: "Outreach Events", href: "/community/outreach-events" },
  { label: "Workshops", href: "/community/workshops" },
];

export const professionalLinks: NavLink[] = [
  { label: "Articles", href: "/professional-development/articles" },
  { label: "Poster Presentations", href: "/professional-development/poster-presentations" },
  { label: "Webinars", href: "/professional-development/webinars" },
  { label: "Publications", href: "/professional-development/publications" },
];

export const awardAnchors: NavLink[] = [
  { label: "Nomination Process", href: "/awards#nomination-process" },
  { label: "Eligibility", href: "/awards#eligibility" },
  { label: "Award Categories", href: "/awards#award-categories" },
  { label: "Subject Domains", href: "/awards#subject-domains" },
  { label: "FAQ", href: "/awards#faq" },
];

export const profileLinks: NavLink[] = [
  { label: "Account", href: "/account" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Donate", href: "/donate" },
];
