import base64
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from papers.models import Paper

from .models import Entitlement
from .snipcart import token_is_valid


def paper():
    return Paper.objects.create(
        slug="gbm-signatures",
        category=Paper.Category.BIOMEDICAL_AI,
        title="Gene co-expression networks in glioblastoma",
        authors="A. SreeRamachandrarao, A. L. Dharmavathi, and S. Dronamraju",
        year=None,
        sku="paper-gbm-signatures",
        price="29.00",
        abstract="Network signatures.",
        pdf_filename="gene-co-expression-networks-in-glioblastoma-multiforme.pdf",
    )


class SnipcartWebhookTests(TestCase):
    def setUp(self):
        self.paper = paper()

    def post_order(self, content, event="order.completed", token="request-token"):
        return self.client.post(
            "/api/entitlements/snipcart/webhook/",
            data=json.dumps({"eventName": event, "content": content}),
            content_type="application/json",
            HTTP_X_SNIPCART_REQUESTTOKEN=token,
        )

    @override_settings(SNIPCART_API_KEY="")
    def test_missing_secret_does_not_grant_access(self):
        with patch("entitlements.views.token_is_valid") as verify:
            response = self.post_order(
                {
                    "email": "reader@example.com",
                    "invoiceNumber": "INV-1",
                    "items": [{"id": self.paper.sku}],
                }
            )
        self.assertEqual(response.status_code, 503)
        self.assertIn("SNIPCART_API_KEY", response.json()["detail"])
        self.assertEqual(Entitlement.objects.count(), 0)
        verify.assert_not_called()

    @override_settings(SNIPCART_API_KEY="test-secret-value")
    def test_paid_paper_order_creates_an_entitlement(self):
        with patch("entitlements.views.token_is_valid", return_value=True):
            response = self.post_order(
                {
                    "email": "Reader@Example.com",
                    "invoiceNumber": "INV-9",
                    "paymentStatus": "Paid",
                    "items": [
                        {"id": "paper-gbm-signatures", "name": "GBM"},
                        {"id": "sub-researcher-monthly", "name": "Researcher"},
                    ],
                }
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["granted"], ["paper-gbm-signatures"])
        entitlement = Entitlement.objects.get()
        self.assertEqual(entitlement.paper, self.paper)
        self.assertEqual(entitlement.snipcart_invoice, "INV-9")
        self.assertEqual(entitlement.user.email, "reader@example.com")

    @override_settings(SNIPCART_API_KEY="test-secret-value")
    def test_invalid_token_is_rejected(self):
        with patch("entitlements.views.token_is_valid", return_value=False):
            response = self.post_order(
                {"email": "reader@example.com", "items": [{"id": self.paper.sku}]}
            )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(Entitlement.objects.count(), 0)

    @override_settings(SNIPCART_API_KEY="test-secret-value")
    def test_unpaid_order_does_not_grant_access(self):
        with patch("entitlements.views.token_is_valid", return_value=True):
            response = self.post_order(
                {
                    "email": "reader@example.com",
                    "paymentStatus": "Failed",
                    "items": [{"id": self.paper.sku}],
                }
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Entitlement.objects.count(), 0)

    @override_settings(SNIPCART_API_KEY="test-secret-value")
    def test_validation_sends_the_secret_as_basic_auth_username(self):
        captured = {}

        class Response:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        def opener(request, timeout=10):
            captured["url"] = request.full_url
            captured["authorization"] = request.get_header("Authorization")
            captured["timeout"] = timeout
            return Response()

        self.assertTrue(token_is_valid("abc token", opener=opener))
        expected = "Basic " + base64.b64encode(b"test-secret-value:").decode("ascii")
        self.assertEqual(captured["authorization"], expected)
        self.assertIn("abc%20token", captured["url"])
        self.assertEqual(get_user_model().objects.count(), 0)


class PaperFileTests(TestCase):
    def setUp(self):
        self.paper = paper()
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.pdf = Path(self.directory.name) / self.paper.pdf_filename
        self.pdf.write_bytes(b"%PDF-1.4\nfull manuscript\n%%EOF\n")
        self.override = override_settings(PAPER_FILES_ROOT=self.directory.name)
        self.override.enable()
        self.addCleanup(self.override.disable)

    def claim(self, email="buyer@example.com", sku=None, order_token="order-token-123456"):
        return self.client.post(
            "/api/entitlements/purchases/",
            data=json.dumps(
                {
                    "email": email,
                    "sku": sku or self.paper.sku,
                    "orderToken": order_token,
                }
            ),
            content_type="application/json",
        )

    def test_full_pdfs_are_not_public_static_files(self):
        repo = Path(__file__).resolve().parents[2]
        public_pdfs = list((repo / "frontend" / "public").rglob("*.pdf"))
        self.assertTrue(public_pdfs)
        for path in public_pdfs:
            self.assertIn("previews", path.parts)
        private = repo / "backend" / "private_papers" / self.paper.pdf_filename
        self.assertTrue(private.is_file())
        self.assertGreater(private.stat().st_size, 100_000)
        preview = (
            repo
            / "frontend"
            / "public"
            / "papers"
            / "previews"
            / "gene-co-expression-networks-in-glioblastoma-multiforme-page-1.pdf"
        )
        self.assertTrue(preview.is_file())
        self.assertLess(preview.stat().st_size, private.stat().st_size)

    @override_settings(SNIPCART_API_KEY="")
    def test_unpaid_visitor_cannot_fetch_the_full_file(self):
        missing = self.client.get(f"/api/entitlements/papers/{self.paper.sku}/file/")
        self.assertEqual(missing.status_code, 403)
        self.assertNotIn(b"%PDF", missing.content)

        forged = self.client.get(
            f"/api/entitlements/papers/{self.paper.sku}/file/",
            {"access": "not-a-real-purchase-token"},
        )
        self.assertEqual(forged.status_code, 403)
        self.assertNotIn(b"%PDF", forged.content)
        self.assertEqual(Entitlement.objects.count(), 0)

    @override_settings(SNIPCART_API_KEY="")
    def test_completed_purchase_serves_the_full_file_to_that_buyer(self):
        with patch("entitlements.purchases.fetch_order") as fetch:
            response = self.claim()
        fetch.assert_not_called()
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        self.assertGreaterEqual(len(token), 20)

        owned = self.client.get(f"/api/entitlements/papers/{self.paper.sku}/file/", {"access": token})
        self.assertEqual(owned.status_code, 200)
        self.assertEqual(owned["Content-Type"], "application/pdf")
        self.assertEqual(b"".join(owned.streaming_content), self.pdf.read_bytes())
        self.assertIn("inline", owned["Content-Disposition"])

        download = self.client.get(
            f"/api/entitlements/papers/{self.paper.sku}/file/",
            {"access": token, "download": "1"},
        )
        self.assertIn("attachment", download["Content-Disposition"])

        again = self.claim()
        self.assertEqual(again.json()["access_token"], token)

    @override_settings(SNIPCART_API_KEY="")
    def test_purchase_token_does_not_open_another_paper(self):
        other = Paper.objects.create(
            slug="nilearn-image-paper",
            category=Paper.Category.BIOMEDICAL_AI,
            title="Nilearn",
            authors="A. Chen",
            sku="paper-nilearn-image",
            price="29.00",
            abstract="Maps.",
            pdf_filename="nilearn-image-paper.pdf",
        )
        (Path(self.directory.name) / other.pdf_filename).write_bytes(b"%PDF-1.4\nother\n%%EOF\n")
        token = self.claim().json()["access_token"]
        blocked = self.client.get(f"/api/entitlements/papers/{other.sku}/file/", {"access": token})
        self.assertEqual(blocked.status_code, 403)
        self.assertNotIn(b"%PDF", blocked.content)

    @override_settings(SNIPCART_API_KEY="")
    def test_incomplete_checkout_does_not_grant_a_file(self):
        response = self.claim(order_token="")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Entitlement.objects.count(), 0)

    @override_settings(SNIPCART_API_KEY="")
    def test_same_order_cannot_be_claimed_by_another_account(self):
        token = self.claim().json()["access_token"]
        stolen = self.claim(email="other@example.com")
        self.assertEqual(stolen.status_code, 403)
        blocked = self.client.get(f"/api/entitlements/papers/{self.paper.sku}/file/", {"access": "x" * 24})
        self.assertEqual(blocked.status_code, 403)
        owned = self.client.get(f"/api/entitlements/papers/{self.paper.sku}/file/", {"access": token})
        self.assertEqual(owned.status_code, 200)

    @override_settings(SNIPCART_API_KEY="test-secret-value")
    def test_secret_must_confirm_the_order_before_the_file_is_served(self):
        paid = {
            "paymentStatus": "Paid",
            "invoiceNumber": "INV-3",
            "items": [{"id": self.paper.sku}],
        }
        with patch("entitlements.purchases.fetch_order", return_value=paid) as fetch:
            response = self.claim(order_token="confirmed-order-token")
        fetch.assert_called_once()
        self.assertEqual(response.status_code, 200)
        token = response.json()["access_token"]
        owned = self.client.get(f"/api/entitlements/papers/{self.paper.sku}/file/", {"access": token})
        self.assertEqual(owned.status_code, 200)

        with patch("entitlements.purchases.fetch_order", return_value=None):
            rejected = self.claim(email="unpaid@example.com", order_token="rejected-order-token")
        self.assertEqual(rejected.status_code, 403)
        self.assertFalse(Entitlement.objects.filter(user__email="unpaid@example.com").exists())
