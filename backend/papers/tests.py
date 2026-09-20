from django.test import TestCase


class HealthTests(TestCase):
    def test_health_ok(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["service"], "scientific-researchers-api")
