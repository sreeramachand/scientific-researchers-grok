from django.test import TestCase, override_settings

from identity.notice import NOT_CONFIGURED
from identity.testing import verified_session

from .models import SessionRsvp
from .sessions import SESSIONS


@override_settings(EMAIL_HOST="")
class WebinarRsvpTests(TestCase):
    def test_public_calendar_hides_meet_links(self):
        response = self.client.get("/api/webinars/sessions/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertNotIn("meet.google.com", body)
        self.assertEqual(
            [row["id"] for row in response.json()],
            ["2026-11-20", "2026-12-18", "2027-01-22"],
        )
        self.assertEqual(response.json()[0]["time_label"], "7:00–8:00 PM ET")
        self.assertEqual(
            [session["meet_url"] for session in SESSIONS],
            [
                "https://meet.google.com/nci-zpkx-kny",
                "https://meet.google.com/ibw-nvso-kez",
                "https://meet.google.com/nca-svab-ipz",
            ],
        )

    def test_message_of_interest_is_required_before_the_link(self):
        missing = self.client.post(
            "/api/webinars/rsvp/",
            data={"session_id": "2026-11-20", "name": "Ada", "email": "ada@example.com", "message": "   "},
            content_type="application/json",
        )
        self.assertEqual(missing.status_code, 400)
        self.assertEqual(SessionRsvp.objects.count(), 0)
        self.assertNotIn("meet.google.com", missing.content.decode())

        saved = self.client.post(
            "/api/webinars/rsvp/",
            data={
                "session_id": "2026-11-20",
                "name": "Ada Lovelace",
                "email": "Ada@Example.com",
                "message": "I would like to attend the information session.",
            },
            content_type="application/json",
        )
        self.assertEqual(saved.status_code, 201)
        payload = saved.json()
        self.assertEqual(payload["meet_url"], "https://meet.google.com/nci-zpkx-kny")
        self.assertFalse(payload["notification_sent"])
        self.assertEqual(payload["notification_error"], NOT_CONFIGURED)
        row = SessionRsvp.objects.get()
        self.assertEqual(row.email, "ada@example.com")
        self.assertEqual(row.session_id, "2026-11-20")
        self.assertIn("information session", row.message)

    def test_reviewer_sees_rsvps_and_other_accounts_do_not(self):
        SessionRsvp.objects.create(
            session_id="2026-12-18",
            name="Grace",
            email="grace@example.com",
            message="Please count me in.",
            notification_sent=False,
            notification_error=NOT_CONFIGURED,
        )
        anonymous = self.client.get("/api/webinars/rsvps/")
        self.assertEqual(anonymous.status_code, 401)
        self.assertNotIn("grace@example.com", anonymous.content.decode())

        with verified_session("visitor@example.com", "Visitor") as token:
            visitor = self.client.get("/api/webinars/rsvps/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(visitor.status_code, 403)
        self.assertNotIn("grace@example.com", visitor.content.decode())

        with verified_session("asreera110@scientificml.net", "Reviewer") as token:
            reviewer = self.client.get("/api/webinars/rsvps/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(reviewer.status_code, 200)
        row = reviewer.json()[0]
        self.assertEqual(row["name"], "Grace")
        self.assertEqual(row["email"], "grace@example.com")
        self.assertEqual(row["message"], "Please count me in.")
        self.assertEqual(row["session_id"], "2026-12-18")
        self.assertFalse(row["notification_sent"])
        self.assertEqual(row["notification_error"], NOT_CONFIGURED)
