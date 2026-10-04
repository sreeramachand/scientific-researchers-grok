import type { Paper } from "../data/papers.ts";

export function isPublished(paper: Paper): boolean {
  return paper.published !== false;
}

export function searchPapers(list: readonly Paper[], query: string): Paper[] {
  const published = list.filter(isPublished);
  const needle = query.trim().toLowerCase();
  if (!needle) return [...published];
  return published.filter((paper) => {
    const haystack = [paper.title, paper.authors, paper.abstract, ...paper.keywords].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}
