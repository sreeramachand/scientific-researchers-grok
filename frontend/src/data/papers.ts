export type PaperCategory = "biomedical-ai" | "visual" | "cancer";

export type Paper = {
  slug: string;
  category: PaperCategory;
  categoryLabel: string;
  navLabel: string;
  title: string;
  subtitle: string;
  authors: string;
  year: number | null;
  doi: string;
  sku: string;
  price: number;
  abstract: string;
  keywords: string[];
  highlights: string[];
  methods: string;
  /** Public single-page preview. Omit when the paper has no first-page file. */
  previewPath?: string;
  /** Omitted papers are published. Set false to keep a row out of search and the catalog. */
  published?: boolean;
};

export const categoryMeta: Record<
  PaperCategory,
  { label: string; href: string; description: string }
> = {
  "biomedical-ai": {
    label: "Biomedical AI",
    href: "/projects/biomedical-ai",
    description:
      "Computational imaging, neuroimaging toolkits, and gene co-expression networks that turn high-dimensional biomedical data into reproducible findings.",
  },
  visual: {
    label: "Visual",
    href: "/projects/visual",
    description:
      "Ocular oncology and retinal screening research that pairs clinical imaging with quantitative visual biomarkers.",
  },
  cancer: {
    label: "Cancer",
    href: "/projects/cancer",
    description:
      "Translational oncology papers spanning thoracic and colorectal disease, from risk stratification to treatment-response signatures.",
  },
};

export const papers: Paper[] = [
  {
    slug: "gbm-signatures",
    category: "biomedical-ai",
    categoryLabel: "Biomedical AI",
    navLabel: "GBM co-expression networks",
    title: "Biomedical Oncology Application of Gene Co-expression Networks in Glioblastoma Multiforme",
    subtitle: "Four graph-theoretic signatures that separate glioblastoma networks from normal brain",
    authors: "Adityakrishna SreeRamachandrarao, Anusha Lakshmi Dharmavathi, and Satyavathi Dronamraju",
    year: null,
    doi: "",
    sku: "paper-gbm-signatures",
    price: 29,
    abstract:
      "This paper treats glioblastoma as a network-level disorder rather than a short list of mutations. Genes are nodes, and co-expression links that remain significant after Benjamini–Hochberg correction are edges. Comparing glioblastoma multiforme with normal brain, four signatures separate the networks: degree distribution and power-law exponent, clique cover and Ramsey substructure, k-core decomposition, and the signed Laplacian spectrum. The cancer network has heavier hub tails and a lower power-law exponent, a higher clique cover with denser overlapping communities, deeper nested cores beside a fragmented periphery, and a broader spectrum with negative eigenvalues and lower algebraic connectivity.",
    keywords: [
      "glioblastoma",
      "co-expression",
      "gene network",
      "power-law",
      "Ramsey",
      "k-core",
      "signed-laplacian",
      "algebraic connectivity",
      "Benjamini-Hochberg",
      "NetworkX",
    ],
    highlights: [
      "Degree distribution and power-law exponent: heavier tails and a lower exponent in glioblastoma, with more dominant hubs than in normal brain",
      "Clique cover and Ramsey substructure: higher clique cover, with larger and denser overlapping communities in the cancer network",
      "k-core decomposition: higher maximum coreness and a deeper nested core in glioblastoma, alongside a more fragmented periphery",
      "Signed Laplacian spectrum: a broader cancer spectrum, negative eigenvalues that are absent in normal brain, and lower algebraic connectivity",
    ],
    methods:
      "Public glioblastoma and normal brain expression sets were filtered, log-transformed, and aligned to a shared gene set. Pairwise Pearson correlations became weighted, signed edges only when p < 0.05 after Benjamini–Hochberg correction. The networks were built in Python with NetworkX. Power-law fits used maximum likelihood and a bootstrap goodness-of-fit check; clique size, coreness, and algebraic connectivity were compared with Mann–Whitney U tests. Glioblastoma differed from normal brain on every signature tested.",
    previewPath: "/papers/previews/gene-co-expression-networks-in-glioblastoma-multiforme-page-1.pdf",
    published: true,
  },
];

export function paperBySlug(slug: string): Paper | undefined {
  return papers.find((paper) => paper.slug === slug);
}

export function papersByCategory(category: PaperCategory): Paper[] {
  return papers.filter((paper) => paper.category === category && paper.published !== false);
}

export const categorySlugs = Object.keys(categoryMeta) as PaperCategory[];
