from django.core.management.base import BaseCommand

from papers.models import Paper

PAPERS = [
    {
        "slug": "gbm-signatures",
        "category": Paper.Category.BIOMEDICAL_AI,
        "title": "Biomedical Oncology Application of Gene Co-expression Networks in Glioblastoma Multiforme",
        "subtitle": "Four graph-theoretic signatures that separate glioblastoma networks from normal brain",
        "authors": "Adityakrishna SreeRamachandrarao, Anusha Lakshmi Dharmavathi, and Satyavathi Dronamraju",
        "year": None,
        "doi": "",
        "sku": "paper-gbm-signatures",
        "price": "29.00",
        "abstract": (
            "This paper treats glioblastoma as a network-level disorder rather than a short list of mutations. "
            "Genes are nodes, and co-expression links that remain significant after Benjamini–Hochberg correction are edges. "
            "Comparing glioblastoma multiforme with normal brain, four signatures separate the networks: "
            "degree distribution and power-law exponent, clique cover and Ramsey substructure, "
            "k-core decomposition, and the signed Laplacian spectrum."
        ),
        "keywords": [
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
        "pdf_filename": "gene-co-expression-networks-in-glioblastoma-multiforme.pdf",
        "is_published": True,
    },
]


class Command(BaseCommand):
    help = "Keep the published paper database limited to papers that are actually published."

    def handle(self, *args, **options):
        kept = []
        for payload in PAPERS:
            Paper.objects.update_or_create(slug=payload["slug"], defaults=payload)
            kept.append(payload["slug"])
        removed, _ = Paper.objects.exclude(slug__in=kept).delete()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(kept)} published papers; removed {removed} other rows"))
