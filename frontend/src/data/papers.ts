export type PaperCategory = "biomedical-ai" | "visual" | "cancer";

export type Paper = {
  slug: string;
  category: PaperCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  authors: string;
  year: number;
  doi: string;
  sku: string;
  price: number;
  abstract: string;
  highlights: string[];
  methods: string;
  pdfPath: string;
};

export const categoryMeta: Record<
  PaperCategory,
  { label: string; href: string; description: string }
> = {
  "biomedical-ai": {
    label: "Biomedical AI",
    href: "/projects/biomedical-ai",
    description:
      "Computational imaging, neuroimaging toolkits, and molecular signature models that turn high-dimensional biomedical data into reproducible findings.",
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
    slug: "nilearn-image-paper",
    category: "biomedical-ai",
    categoryLabel: "Biomedical AI",
    title: "Reproducible neuroimaging maps with Nilearn",
    subtitle: "A methods paper on standardized image decoding and statistical maps",
    authors: "A. Chen, R. Okonkwo, M. Alvarez, Scientific Researchers Imaging Lab",
    year: 2025,
    doi: "10.0000/sr.nilearn.2025",
    sku: "paper-nilearn-image",
    price: 29,
    abstract:
      "We present a reproducible pipeline for decoding task and resting-state fMRI using Nilearn, with open statistical maps, quality-control dashboards, and a reference implementation for multi-site harmonization. The paper reports effect-size stability across three public cohorts and a recommended reporting checklist for imaging-genetics studies.",
    highlights: [
      "Site-harmonized Nilearn workflows for GLM and connectome analyses",
      "Open statistical maps with versioned figure regeneration",
      "Checklist for reporting imaging pipelines in biomedical AI",
    ],
    methods:
      "Preprocessing followed fMRIPrep-compatible inputs. First-level models used Nilearn’s FirstLevelModel with canonical HRF and motion regressors. Second-level inference used permutation tests (10,000 iterations) with cluster-level FWE control. Harmonization compared ComBat and linear mixed-effects site terms.",
    pdfPath: "/papers/nilearn-image-paper.pdf",
  },
  {
    slug: "gbm-signatures",
    category: "biomedical-ai",
    categoryLabel: "Biomedical AI",
    title: "Glioblastoma transcriptional signatures",
    subtitle: "Multi-omic classifiers for GBM subtype and treatment context",
    authors: "S. Rahman, L. Petrova, J. Walsh, Scientific Researchers Oncology Lab",
    year: 2025,
    doi: "10.0000/sr.gbm.2025",
    sku: "paper-gbm-signatures",
    price: 29,
    abstract:
      "This study derives compact glioblastoma signatures from RNA-seq and methylation arrays, then tests whether those signatures remain predictive after standard chemoradiation. We report a 24-gene panel that stratifies survival independently of MGMT and a spatial transcriptomics overlay that localizes the signature to infiltrative margins.",
    highlights: [
      "24-gene GBM panel independent of MGMT status",
      "Cross-validated on TCGA and an institutional hold-out",
      "Spatial overlay at infiltrative tumor margins",
    ],
    methods:
      "Bulk RNA-seq was batch-corrected and filtered to protein-coding genes. Elastic-net Cox models were nested inside 5-fold cross-validation. Methylation probes were reduced with supervised PCA. Spatial validation used Visium spots mapped to histologic regions.",
    pdfPath: "/papers/gbm-signatures.pdf",
  },
  {
    slug: "uveal-melanoma",
    category: "visual",
    categoryLabel: "Visual",
    title: "Imaging biomarkers in uveal melanoma",
    subtitle: "Quantitative fundus and ultrasound features for metastatic risk",
    authors: "N. Iyer, C. Brooks, H. Sato, Scientific Researchers Visual Lab",
    year: 2024,
    doi: "10.0000/sr.uveal.2024",
    sku: "paper-uveal-melanoma",
    price: 29,
    abstract:
      "We quantify multimodal imaging features in uveal melanoma—including tumor thickness, pigmentation texture, and extrascleral clues—and relate them to gene-expression class and metastatic events. A locked imaging score improves risk communication when cytogenetic results are delayed.",
    highlights: [
      "Multimodal fundus and B-scan feature atlas",
      "Locked imaging score for interim risk counseling",
      "Agreement study across three ocular oncology readers",
    ],
    methods:
      "Consecutive treatment-naive tumors were imaged with widefield color, autofluorescence, and standardized B-scan. Features were extracted with a controlled annotation protocol. Outcomes included GEP class and time to metastasis, modeled with Fine–Gray competing risks.",
    pdfPath: "/papers/uveal-melanoma.pdf",
  },
  {
    slug: "diabetic-retinopathy",
    category: "visual",
    categoryLabel: "Visual",
    title: "Diabetic retinopathy screening models",
    subtitle: "Clinic-ready grading with calibrated referable-disease predictions",
    authors: "P. Mensah, D. Ruiz, K. Holtz, Scientific Researchers Visual Lab",
    year: 2025,
    doi: "10.0000/sr.dr.2025",
    sku: "paper-diabetic-retinopathy",
    price: 29,
    abstract:
      "A calibrated screening model for referable diabetic retinopathy is evaluated on mixed camera vendors. We emphasize threshold selection for safety-net clinics, explainable lesion heatmaps, and a human-in-the-loop review protocol that keeps false negatives below a pre-registered bound.",
    highlights: [
      "Vendor-mixed fundus photographs from four clinic networks",
      "Pre-registered false-negative bound with human review",
      "Calibrated probabilities for referable disease",
    ],
    methods:
      "Models were trained with lesion-aware augmentations and temperature scaling. Operating points were chosen on a validation clinic, then frozen. A second reader reviewed model-negative studies in a 10% audit plus all high-uncertainty cases.",
    pdfPath: "/papers/diabetic-retinopathy.pdf",
  },
  {
    slug: "lung-paper",
    category: "cancer",
    categoryLabel: "Cancer",
    title: "Lung cancer risk and response paper",
    subtitle: "CT radiomics plus circulating markers for early thoracic oncology",
    authors: "E. Novak, T. Singh, F. Moreau, Scientific Researchers Cancer Lab",
    year: 2025,
    doi: "10.0000/sr.lung.2025",
    sku: "paper-lung",
    price: 29,
    abstract:
      "This paper combines low-dose CT radiomics with a focused circulating-marker panel to refine lung-cancer risk after a positive screen and to monitor early response after systemic therapy. We describe a locked analysis plan, site-level performance, and a recommended clinical workflow.",
    highlights: [
      "Radiomics features stable across two CT vendors",
      "Circulating-marker panel for response monitoring",
      "Workflow for multidisciplinary tumor boards",
    ],
    methods:
      "Nodules were segmented with a dual-reader protocol. Radiomics features were ICC-filtered. Circulating markers were assayed in duplicate. Joint models predicted cancer diagnosis and 12-week response, with decision-curve analysis versus volume doubling time alone.",
    pdfPath: "/papers/lung-paper.pdf",
  },
  {
    slug: "colon-cancer-paper",
    category: "cancer",
    categoryLabel: "Cancer",
    title: "Colon cancer paper",
    subtitle: "Transcriptomic and pathology signatures in colorectal adenocarcinoma",
    authors: "M. Haddad, Y. Cho, B. Ellis, Scientific Researchers Cancer Lab",
    year: 2024,
    doi: "10.0000/sr.colon.2024",
    sku: "paper-colon-cancer",
    price: 29,
    abstract:
      "We integrate H&E-based pathology embeddings with tumor-transcriptome subtypes to identify colon adenocarcinoma groups that differ in adjuvant-therapy benefit. The paper includes an external pathology-only classifier for settings without sequencing.",
    highlights: [
      "Pathology-only classifier when sequencing is unavailable",
      "Subtype-specific adjuvant-therapy signals",
      "External validation on a second hospital system",
    ],
    methods:
      "Resection slides were tiled and embedded with a weakly supervised encoder. RNA-seq subtypes were assigned with a published CMS-compatible classifier. Benefit analyses used inverse-probability weighting with pre-specified confounders.",
    pdfPath: "/papers/colon-cancer-paper.pdf",
  },
];

export function paperBySlug(slug: string): Paper | undefined {
  return papers.find((paper) => paper.slug === slug);
}

export function papersByCategory(category: PaperCategory): Paper[] {
  return papers.filter((paper) => paper.category === category);
}

export const categorySlugs = Object.keys(categoryMeta) as PaperCategory[];
