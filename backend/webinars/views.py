import re

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from identity.neon_jwt import actor_from_request
from identity.notice import send_notice
from identity.reviewers import is_reviewer

from .models import SessionRsvp
from .sessions import BY_ID, SESSIONS, public_session

EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def clean_email(value: str) -> str | None:
    email = value.strip().lower()
    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        return None
    return email


class SessionListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([public_session(session) for session in SESSIONS])


class RsvpCreateView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        session = BY_ID.get(str(payload.get("session_id") or "").strip())
        if session is None:
            return Response({"detail": "Choose one of the listed information sessions."}, status=400)
        name = str(payload.get("name") or "").strip()
        if not name or len(name) > 120:
            return Response({"detail": "Enter your name."}, status=400)
        email = clean_email(str(payload.get("email") or ""))
        if email is None:
            return Response({"detail": "Enter a valid email address."}, status=400)
        message = str(payload.get("message") or "").strip()
        if not message:
            return Response({"detail": "A message of interest is required."}, status=400)
        if len(message) > 4000:
            return Response({"detail": "The message of interest is too long."}, status=400)

        sent, error = send_notice(
            f"Webinar RSVP {session['label']}",
            f"Session: {session['label']} ({session['time_label']})\nName: {name}\nEmail: {email}\n\nMessage of interest:\n{message}\n",
        )
        rsvp = SessionRsvp.objects.create(
            session_id=session["id"],
            name=name,
            email=email,
            message=message,
            notification_sent=sent,
            notification_error="" if sent else error,
        )
        return Response(
            {
                "id": rsvp.id,
                "session_id": rsvp.session_id,
                "meet_url": session["meet_url"],
                "notification_sent": rsvp.notification_sent,
                "notification_error": rsvp.notification_error,
            },
            status=201,
        )


class RsvpListView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        actor = actor_from_request(request)
        if actor is None:
            return Response({"detail": "Sign in so we can confirm this account."}, status=401)
        if not is_reviewer(actor.email):
            return Response({"detail": "This list is only for the reviewer."}, status=403)
        rows = [
            {
                "id": rsvp.id,
                "session_id": rsvp.session_id,
                "name": rsvp.name,
                "email": rsvp.email,
                "message": rsvp.message,
                "notification_sent": rsvp.notification_sent,
                "notification_error": rsvp.notification_error,
                "created_at": rsvp.created_at.isoformat(),
            }
            for rsvp in SessionRsvp.objects.all()
        ]
        return Response(rows)
