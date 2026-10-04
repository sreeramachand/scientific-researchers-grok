export type PosterConference = {
  name: string;
  region: "United States" | "Europe" | "Asia";
  href: string;
  detail: string;
};

/**
 * Official pages checked on 2026-10-03. Dates below are the ones those pages state.
 * No conference is listed without an official URL.
 */
export const posterConferences: PosterConference[] = [
  {
    name: "Intelligent Systems for Molecular Biology (ISMB)",
    region: "United States",
    href: "https://www.iscb.org/ismb2026/home/",
    detail:
      "ISCB’s annual conference. ISMB 2026 met July 12–16 in Washington, D.C., and the programme included poster presentations.",
  },
  {
    name: "Pacific Symposium on Biocomputing (PSB)",
    region: "United States",
    href: "https://psb.stanford.edu/",
    detail:
      "PSB 2027 is January 3–7, 2027, at the Fairmont Orchid on the Big Island of Hawaii. The official key dates include an abstract and poster session.",
  },
  {
    name: "European Conference on Computational Biology (ECCB)",
    region: "Europe",
    href: "https://eccb2026.org/",
    detail:
      "ECCB 2026 in Geneva, organized by the SIB Swiss Institute of Bioinformatics, ran August 31–September 4, 2026, with poster sessions in the scientific programme.",
  },
  {
    name: "RECOMB",
    region: "Europe",
    href: "https://recomb.org/recomb2026/",
    detail:
      "Research in Computational Molecular Biology. The 30th RECOMB met May 26–29, 2026, in Thessaloniki and included poster sessions. That page also names RECOMB 2027 in Toronto.",
  },
  {
    name: "International Conference on Bioinformatics (InCoB)",
    region: "Asia",
    href: "https://incob.apbionet.org/incob2026/",
    detail:
      "InCoB/ISCB-APAC 2026, the 25th InCoB, met September 14–17, 2026, in Penang, Malaysia. The official programme includes poster sessions.",
  },
];
