"""Office notices. Mail is sent only when this server already has EMAIL_HOST."""

from django.conf import settings
from django.core.mail import send_mail

from .reviewers import NOTIFY_EMAIL

NOT_CONFIGURED = "Outbound email is not configured, so the notice was not sent."
NOT_SENT = "The notice could not be sent."


def send_notice(subject: str, body: str) -> tuple[bool, str]:
    host = str(getattr(settings, "EMAIL_HOST", "") or "").strip()
    if not host:
        return False, NOT_CONFIGURED
    try:
        sent = send_mail(
            subject[:200],
            body,
            getattr(settings, "DEFAULT_FROM_EMAIL", None) or "hello@scientificresearchers.org",
            [NOTIFY_EMAIL],
            fail_silently=False,
        )
    except Exception:
        return False, NOT_SENT
    if sent < 1:
        return False, NOT_SENT
    return True, ""
