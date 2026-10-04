from django.test import TestCase, override_settings

from identity.neon_jwt import validate_neon_token
from identity.notice import NOT_CONFIGURED, send_notice
from identity.reviewers import is_reviewer
from identity.testing import verified_session


class ReviewerTests(TestCase):
    def test_only_the_two_reviewer_accounts(self):
        self.assertTrue(is_reviewer("asreera110@gmail.com"))
        self.assertTrue(is_reviewer("ASREERA110@scientificml.net"))
        self.assertFalse(is_reviewer("asreera110@gmail.com.attacker.test"))
        self.assertFalse(is_reviewer("visitor@example.com"))
        self.assertFalse(is_reviewer(""))
        self.assertFalse(is_reviewer(None))


class NeonTokenTests(TestCase):
    def test_verified_token_returns_the_email(self):
        with verified_session("asreera110@gmail.com", "Reviewer") as token:
            payload = validate_neon_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["email"], "asreera110@gmail.com")

    def test_rejects_a_token_without_neon(self):
        with override_settings(NEON_AUTH_BASE_URL=""):
            self.assertIsNone(validate_neon_token("a.b.c"))


class NoticeTests(TestCase):
    @override_settings(EMAIL_HOST="")
    def test_missing_mail_host_is_a_visible_failure(self):
        sent, error = send_notice("Hello", "Body")
        self.assertFalse(sent)
        self.assertEqual(error, NOT_CONFIGURED)
