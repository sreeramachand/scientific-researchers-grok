from django.core.management import call_command
from django.test import TestCase

from papers.models import Paper


def make_paper(**overrides):
    payload = {
        "slug": "gbm-signatures",
        "category": Paper.Category.BIOMEDICAL_AI,
        "title": "Biomedical Oncology Application of Gene Co-expression Networks in Glioblastoma Multiforme",
        "authors": "Adityakrishna SreeRamachandrarao, Anusha Lakshmi Dharmavathi, and Satyavathi Dronamraju",
        "year": None,
        "sku": "paper-gbm-signatures",
        "price": "29.00",
        "abstract": "Four signatures include Ramsey substructure and k-core decomposition.",
        "keywords": ["signed-laplacian", "glioblastoma"],
        "pdf_filename": "gene-co-expression-networks-in-glioblastoma-multiforme.pdf",
        "is_published": True,
    }
    payload.update(overrides)
    slug = payload.pop("slug")
    row, _created = Paper.objects.update_or_create(slug=slug, defaults=payload)
    return row


class HealthTests(TestCase):
    def test_health_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["service"], "scientific-researchers-api")


class PublishedPaperSearchTests(TestCase):
    def setUp(self):
        self.paper = make_paper()
        make_paper(
            slug="draft-note",
            sku="paper-draft-note",
            title="Unpublished draft about xylophone methods",
            authors="Hidden Author",
            abstract="signed-laplacian appears only on this draft",
            keywords=["signed-laplacian", "xylophone-quarantine"],
            pdf_filename="draft-note.pdf",
            is_published=False,
        )

    def test_keyword_author_abstract_and_title_search(self):
        keyword = self.client.get("/api/papers/?q=signed-laplacian")
        self.assertEqual(keyword.status_code, 200)
        self.assertEqual([row["slug"] for row in keyword.json()], ["gbm-signatures"])

        author = self.client.get("/api/papers/?q=SreeRamachandrarao")
        self.assertEqual([row["slug"] for row in author.json()], ["gbm-signatures"])

        abstract = self.client.get("/api/papers/?q=Ramsey")
        self.assertEqual([row["slug"] for row in abstract.json()], ["gbm-signatures"])

        title = self.client.get("/api/papers/?q=Glioblastoma Multiforme")
        self.assertEqual([row["slug"] for row in title.json()], ["gbm-signatures"])

    def test_nonsense_query_and_unpublished_rows_are_absent(self):
        response = self.client.get("/api/papers/?q=xylophone-quarantine")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])
        listed = self.client.get("/api/papers/")
        self.assertEqual([row["slug"] for row in listed.json()], ["gbm-signatures"])
        hidden = self.client.get("/api/papers/draft-note/")
        self.assertEqual(hidden.status_code, 404)

    def test_paper_api_cannot_publish_an_upload(self):
        response = self.client.post(
            "/api/papers/",
            data={"title": "Sneaky", "slug": "sneaky", "is_published": True},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 405)
        self.assertFalse(Paper.objects.filter(slug="sneaky").exists())

    def test_seed_drops_placeholder_papers(self):
        make_paper(
            slug="nilearn-image-paper",
            sku="paper-nilearn-image",
            title="Reproducible neuroimaging maps with Nilearn",
            pdf_filename="nilearn-image-paper.pdf",
        )
        call_command("seed_papers")
        self.assertEqual(list(Paper.objects.values_list("slug", flat=True)), ["gbm-signatures"])
        self.assertTrue(Paper.objects.get(slug="gbm-signatures").is_published)


class CatalogMigrationTests(TestCase):
    def test_migrate_leaves_only_the_published_glioblastoma_paper(self):
        paper = Paper.objects.get(slug="gbm-signatures")
        self.assertTrue(paper.is_published)
        self.assertIn("signed-laplacian", paper.keywords)
        response = self.client.get("/api/papers/?q=signed-laplacian")
        self.assertEqual([row["slug"] for row in response.json()], ["gbm-signatures"])
        self.assertEqual(self.client.get("/api/papers/?q=xylophone-quarantine").json(), [])
        self.assertFalse(Paper.objects.filter(slug__in=[
            "nilearn-image-paper",
            "uveal-melanoma",
            "diabetic-retinopathy",
            "lung-paper",
            "colon-cancer-paper",
        ]).exists())
