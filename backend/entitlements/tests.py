import base64
import json
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
