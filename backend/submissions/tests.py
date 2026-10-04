from django.test import TestCase, override_settings

from papers.models import Paper

from identity.notice import NOT_CONFIGURED
from identity.testing import verified_session

from .models import Submission

LATEX_PDF = b"%PDF-1.4\n% produced by pdfTeX-1.40.25\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
PLAIN_PDF = b"%PDF-1.4\n% not a tex file\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def pdf_bytes(response) -> bytes:
    return b"".join(response.streaming_content)


@override_settings(EMAIL_HOST="", SUBMISSION_FILES_ROOT="/tmp/sr-submission-tests")
class SubmissionPrivacyTests(TestCase):
    def post_pdf(self, token, *, title="Network notes", content=LATEX_PDF, filename="notes.pdf"):
        return self.client.post(
            "/api/submissions/",
            data={"title": title, "file": _file(filename, content)},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

    def test_latex_pdf_is_private_until_a_later_publish_step(self):
        with verified_session("author@example.com", "Author One") as token:
            created = self.post_pdf(token, title="Co-expression notes")
            listing = self.client.get("/api/submissions/", HTTP_AUTHORIZATION=f"Bearer {token}")
            download = self.client.get(
                f"/api/submissions/{created.json()['id']}/file/",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
        self.assertEqual(created.status_code, 201)
        body = created.json()
        self.assertEqual(body["title"], "Co-expression notes")
        self.assertEqual(body["submitter_email"], "author@example.com")
        self.assertFalse(body["notification_sent"])
        self.assertEqual(body["notification_error"], NOT_CONFIGURED)
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()[0]["id"], body["id"])
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download["Content-Type"], "application/pdf")
        self.assertTrue(pdf_bytes(download).startswith(b"%PDF-"))
        self.assertFalse(Paper.objects.filter(title="Co-expression notes").exists())
        self.assertEqual(list(Paper.objects.values_list("slug", flat=True)), ["gbm-signatures"])

    def test_other_visitors_cannot_list_or_download(self):
        with verified_session("author@example.com", "Author One") as token:
            created = self.post_pdf(token)
        submission_id = created.json()["id"]

        anonymous = self.client.get("/api/submissions/")
        self.assertEqual(anonymous.status_code, 401)
        open_file = self.client.get(f"/api/submissions/{submission_id}/file/")
        self.assertEqual(open_file.status_code, 401)

        with verified_session("visitor@example.com", "Visitor") as token:
            listing = self.client.get("/api/submissions/", HTTP_AUTHORIZATION=f"Bearer {token}")
            download = self.client.get(
                f"/api/submissions/{submission_id}/file/",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json(), [])
        self.assertEqual(download.status_code, 404)
        self.assertFalse(Submission.objects.get(pk=submission_id).stored_filename in download.content.decode())

    def test_reviewer_sees_the_submission_and_the_mail_failure(self):
        with verified_session("author@example.com", "Author One") as token:
            created = self.post_pdf(token, title="Poster draft")
        with verified_session("asreera110@gmail.com", "Reviewer") as token:
            listing = self.client.get("/api/submissions/", HTTP_AUTHORIZATION=f"Bearer {token}")
            download = self.client.get(
                f"/api/submissions/{created.json()['id']}/file/",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
        self.assertEqual(listing.status_code, 200)
        row = listing.json()[0]
        self.assertEqual(row["title"], "Poster draft")
        self.assertEqual(row["submitter_email"], "author@example.com")
        self.assertEqual(row["submitter_name"], "Author One")
        self.assertFalse(row["notification_sent"])
        self.assertEqual(row["notification_error"], NOT_CONFIGURED)
        self.assertEqual(download.status_code, 200)
        self.assertTrue(pdf_bytes(download).startswith(b"%PDF-"))

    def test_non_latex_pdf_is_rejected_and_not_stored(self):
        with verified_session("author@example.com", "Author One") as token:
            rejected = self.post_pdf(token, content=PLAIN_PDF)
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(Submission.objects.count(), 0)


def _file(name: str, content: bytes):
    from django.core.files.uploadedfile import SimpleUploadedFile

    return SimpleUploadedFile(name, content, content_type="application/pdf")
