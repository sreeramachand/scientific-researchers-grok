import type { PaperCategory } from "./papers";

export type PlaceholderStudy = {
  label: string;
  category: PaperCategory;
  slug: string;
  href: string;
};

/**
 * Dropdown entries that were on the projects menu before the published catalog
 * was reduced to the glioblastoma paper. They stay placeholders until the full
 * papers are uploaded, and they are not published catalog rows.
 */
const studies: Omit<PlaceholderStudy, "href">[] = [
  { label: "Nilearn image paper", category: "biomedical-ai", slug: "nilearn-image-paper" },
  { label: "Uveal melanoma", category: "visual", slug: "uveal-melanoma" },
  { label: "Diabetic retinopathy", category: "visual", slug: "diabetic-retinopathy" },
  { label: "Lung paper", category: "cancer", slug: "lung-paper" },
  { label: "Colon cancer paper", category: "cancer", slug: "colon-cancer-paper" },
];

export const placeholderStudies: PlaceholderStudy[] = studies.map((study) => ({
  ...study,
  href: `/projects/${study.category}/${study.slug}`,
}));

export function placeholderBySlug(slug: string): PlaceholderStudy | undefined {
  return placeholderStudies.find((study) => study.slug === slug);
}
