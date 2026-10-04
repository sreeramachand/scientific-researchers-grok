export type ProgramPage = {
  slug: string;
  title: string;
  kicker: string;
  lede: string;
  sections: { title: string; body: string; items?: string[] }[];
};

export const communityPages: ProgramPage[] = [
  {
    slug: "ai-steam",
    title: "AI/STEAM",
    kicker: "Community Services",
    lede: "Public programs that teach how imaging, models, and measurement actually work — without a paywall.",
    sections: [
      {
        title: "What we teach",
        body: "AI/STEAM sessions are built for libraries, after-school programs, and first-year labs. Participants leave with a notebook exercise, a data card, and language they can reuse when they read a paper abstract.",
        items: [
          "How a model is trained versus how a result is claimed",
          "Reading a figure without over-trusting a heat map",
          "Simple imaging demos using openly licensed scans",
        ],
      },
      {
        title: "Request a session",
        body: "Schools and libraries can request a visit from the Contact page. Materials for facilitators are free; travel is funded by donations when available.",
      },
    ],
  },
  {
    slug: "outreach-events",
    title: "Outreach Events",
    kicker: "Community Services",
    lede: "Open evenings, science fairs, and clinic waiting-room talks that connect research to the people it describes.",
    sections: [
      {
        title: "Upcoming format",
        body: "Events are announced on this page and in the webinar list. Typical nights include a 20-minute talk, a poster corridor, and a question period that is recorded only with consent.",
        items: [
          "County library science nights",
          "Hospital family education hours",
          "Campus open labs during award week",
        ],
      },
    ],
  },
  {
    slug: "workshops",
    title: "Workshops",
    kicker: "Community Services",
    lede: "Half-day workshops on reproducible figures, consent language, and reading oncology or imaging papers.",
    sections: [
      {
        title: "Who should attend",
        body: "Workshops are open. We design them for students and staff who need practice, not for paid credentialing. Project PDFs are not bundled into workshop fees.",
        items: [
          "Reproducible figure clinic",
          "Consent and data-card writing",
          "How to read a methods section in one hour",
        ],
      },
    ],
  },
];

export const professionalPages: ProgramPage[] = [
  {
    slug: "articles",
    title: "Articles",
    kicker: "Professional Development",
    lede: "Short, citable articles on reporting, review, and lab practice. These pages are open.",
    sections: [
      {
        title: "Current series",
        body: "Articles cover how we expect authors to describe models, imaging pipelines, and oncology cohorts. They are not substitutes for the paywalled project PDFs.",
        items: [
          "Reporting checklists for biomedical AI",
          "What a visual-science figure must disclose",
          "Writing a limitations paragraph that a reviewer can test",
        ],
      },
    ],
  },
  {
    slug: "poster-presentations",
    title: "Poster Presentations",
    kicker: "Professional Development",
    lede: "Conferences that accept bioinformatics posters, with links to each meeting’s own page.",
    sections: [
      {
        title: "Where to present",
        body: "The meetings below are active, hold poster sessions at least once a year, and accept bioinformatics papers. They span the United States, Europe, and Asia. This site does not host those posters.",
      },
    ],
  },
  {
    slug: "webinars",
    title: "Webinars",
    kicker: "Professional Development",
    lede: "Three Friday information sessions, 7:00–8:00 PM ET. A message of interest is required before the meeting link is shown.",
    sections: [],
  },
  {
    slug: "publications",
    title: "Publications",
    kicker: "Professional Development",
    lede: "How Scientific Researchers handles authorship, revisions, and the line between open summaries and paid PDFs.",
    sections: [
      {
        title: "Editorial policy",
        body: "We publish original methods and translational studies in biomedical AI, visual science, and cancer. Abstracts, highlights, and methods summaries are open. The typeset PDF is sold per paper or included in a subscription.",
        items: [
          "One corresponding author with an ORCID",
          "Data and code statements on the paper page",
          "No patient-identifiable images in the public abstract",
        ],
      },
    ],
  },
];

export function findProgram(pages: ProgramPage[], slug: string) {
  return pages.find((page) => page.slug === slug);
}
