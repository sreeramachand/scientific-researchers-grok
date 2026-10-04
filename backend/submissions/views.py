from pathlib import Path

from django.http import FileResponse, HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from identity.neon_jwt import actor_from_request
from identity.notice import send_notice
from identity.reviewers import is_reviewer

from .files import MAX_BYTES, is_latex_pdf, resolve_submission_file, save_submission_pdf
from .models import Submission


def submission_payload(row: Submission) -> dict:
    return {
        "id": str(row.id),
        "title": row.title,
        "submitter_name": row.submitter_name,
        "submitter_email": row.submitter_email,
        "original_filename": row.original_filename,
        "notification_sent": row.notification_sent,
        "notification_error": row.notification_error,
        "created_at": row.created_at.isoformat(),
    }


def can_read(actor_email: str, row: Submission) -> bool:
    return is_reviewer(actor_email) or actor_email == row.submitter_email.lower()


class SubmissionListCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        actor = actor_from_request(request)
        if actor is None:
            return Response({"detail": "Sign in to view submissions."}, status=401)
        rows = Submission.objects.all()
        if not is_reviewer(actor.email):
            rows = rows.filter(submitter_email__iexact=actor.email)
        return Response([submission_payload(row) for row in rows])

    def post(self, request):
        actor = actor_from_request(request)
        if actor is None:
            return Response({"detail": "Sign in to submit a PDF."}, status=401)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": "Choose a LaTeX-generated PDF."}, status=400)
        if upload.size > MAX_BYTES:
            return Response({"detail": "PDF must be 20 MB or smaller."}, status=400)
        data = upload.read()
        if not is_latex_pdf(data):
            return Response(
                {"detail": "Upload a PDF produced by LaTeX (pdfTeX, XeTeX, LuaTeX, or MiKTeX)."},
                status=400,
            )
        title = str(request.data.get("title") or "").strip()[:200]
        original = Path(upload.name or "paper.pdf").name[:180] or "paper.pdf"
        stored = save_submission_pdf(data)
        subject = "LaTeX PDF submission"
        body = (
            f"Submitter: {actor.name} <{actor.email}>\n"
            f"Title: {title or '(no title)'}\n"
            f"File: {original}\n"
        )
        sent, error = send_notice(subject, body)
        row = Submission.objects.create(
            submitter_email=actor.email,
            submitter_name=actor.name,
            title=title,
            original_filename=original,
            stored_filename=stored,
            notification_sent=sent,
            notification_error="" if sent else error,
        )
        return Response(submission_payload(row), status=201)


class SubmissionFileView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk):
        actor = actor_from_request(request)
        if actor is None:
            return HttpResponse("Sign in to open this PDF.", status=401, content_type="text/plain")
        row = Submission.objects.filter(pk=pk).first()
        if row is None or not can_read(actor.email, row):
            return HttpResponse("This PDF is not available.", status=404, content_type="text/plain")
        path = resolve_submission_file(row.stored_filename)
        if path is None:
            return HttpResponse("This PDF is not available.", status=404, content_type="text/plain")
        handle = path.open("rb")
        response = FileResponse(handle, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{Path(row.original_filename).name}"'
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store"
        return response
