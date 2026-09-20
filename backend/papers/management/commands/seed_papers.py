from django.core.management.base import BaseCommand

from papers.models import Paper

PAPERS = [
    {
        "slug": "nilearn-image-paper",
        "category": Paper.Category.BIOMEDICAL_AI,
        "title": "Reproducible neuroimaging maps with Nilearn",
        "subtitle": "A methods paper on standardized image decoding and statistical maps",
        "authors": "A. Chen, R. Okonkwo, M. Alvarez, Scientific Researchers Imaging Lab",
        "year": 2025,
        "doi": "10.0000/sr.nilearn.2025",
        "sku": "paper-nilearn-image",
        "price": "29.00",
        "abstract": "We present a reproducible pipeline for decoding task and resting-state fMRI using Nilearn.",
        "pdf_filename": "nilearn-image-paper.pdf",
    },
    {
        "slug": "gbm-signatures",
        "category": Paper.Category.BIOMEDICAL_AI,
        "title": "Glioblastoma transcriptional signatures",
        "subtitle": "Multi-omic classifiers for GBM subtype and treatment context",
        "authors": "S. Rahman, L. Petrova, J. Walsh, Scientific Researchers Oncology Lab",
        "year": 2025,
        "doi": "10.0000/sr.gbm.2025",
        "sku": "paper-gbm-signatures",
        "price": "29.00",
        "abstract": "This study derives compact glioblastoma signatures from RNA-seq and methylation arrays.",
        "pdf_filename": "gbm-signatures.pdf",
    },
    {
        "slug": "uveal-melanoma",
        "category": Paper.Category.VISUAL,
        "title": "Imaging biomarkers in uveal melanoma",
        "subtitle": "Quantitative fundus and ultrasound features for metastatic risk",
        "authors": "N. Iyer, C. Brooks, H. Sato, Scientific Researchers Visual Lab",
        "year": 2024,
        "doi": "10.0000/sr.uveal.2024",
        "sku": "paper-uveal-melanoma",
        "price": "29.00",
        "abstract": "We quantify multimodal imaging features in uveal melanoma and relate them to metastatic events.",
        "pdf_filename": "uveal-melanoma.pdf",
    },
    {
        "slug": "diabetic-retinopathy",
        "category": Paper.Category.VISUAL,
        "title": "Diabetic retinopathy screening models",
        "subtitle": "Clinic-ready grading with calibrated referable-disease predictions",
        "authors": "P. Mensah, D. Ruiz, K. Holtz, Scientific Researchers Visual Lab",
        "year": 2025,
        "doi": "10.0000/sr.dr.2025",
        "sku": "paper-diabetic-retinopathy",
        "price": "29.00",
        "abstract": "A calibrated screening model for referable diabetic retinopathy on mixed camera vendors.",
        "pdf_filename": "diabetic-retinopathy.pdf",
    },
    {
        "slug": "lung-paper",
        "category": Paper.Category.CANCER,
        "title": "Lung cancer risk and response paper",
        "subtitle": "CT radiomics plus circulating markers for early thoracic oncology",
        "authors": "E. Novak, T. Singh, F. Moreau, Scientific Researchers Cancer Lab",
        "year": 2025,
        "doi": "10.0000/sr.lung.2025",
        "sku": "paper-lung",
        "price": "29.00",
        "abstract": "Low-dose CT radiomics with a circulating-marker panel for lung-cancer risk and response.",
        "pdf_filename": "lung-paper.pdf",
    },
    {
        "slug": "colon-cancer-paper",
        "category": Paper.Category.CANCER,
        "title": "Colon cancer paper",
        "subtitle": "Transcriptomic and pathology signatures in colorectal adenocarcinoma",
        "authors": "M. Haddad, Y. Cho, B. Ellis, Scientific Researchers Cancer Lab",
        "year": 2024,
        "doi": "10.0000/sr.colon.2024",
        "sku": "paper-colon-cancer",
        "price": "29.00",
        "abstract": "Pathology embeddings with tumor-transcriptome subtypes in colon adenocarcinoma.",
        "pdf_filename": "colon-cancer-paper.pdf",
    },
]


class Command(BaseCommand):
    help = "Upsert the catalog of project papers."

    def handle(self, *args, **options):
        for payload in PAPERS:
            Paper.objects.update_or_create(slug=payload["slug"], defaults=payload)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(PAPERS)} papers"))
