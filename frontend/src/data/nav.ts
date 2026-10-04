import { placeholderStudies } from "./placeholder-studies.ts";
import { categoryMeta, papers, type PaperCategory } from "./papers.ts";

export type NavLink = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  href: string;
  items: NavLink[];
};

const categoryOrder: PaperCategory[] = ["biomedical-ai", "visual", "cancer"];

export const projectGroups: NavGroup[] = categoryOrder
  .map((category) => {
    const meta = categoryMeta[category];
    const placeholders = placeholderStudies
      .filter((study) => study.category === category)
      .map((study) => ({ label: study.label, href: study.href }));
    const published = papers
      .filter((paper) => paper.category === category && paper.published !== false)
      .map((paper) => ({
        label: paper.navLabel,
        href: `/projects/${paper.category}/${paper.slug}`,
      }));
    return { label: meta.label, href: meta.href, items: [...placeholders, ...published] };
  })
  .filter((group) => group.items.length > 0);

export const projectsMore: NavLink = { label: "More", href: "/projects" };

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

export const awardAnchors: NavLink[] = [{ label: "Awards", href: "/awards" }];

export const profileLinks: NavLink[] = [
  { label: "Account", href: "/account" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Donate", href: "/donate" },
];
