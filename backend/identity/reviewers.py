"""Accounts that may review RSVPs and private submissions."""

REVIEWER_EMAILS = frozenset(
    {
        "asreera110@gmail.com",
        "asreera110@scientificml.net",
    }
)
NOTIFY_EMAIL = "asreera110@scientificml.net"


def is_reviewer(email: str | None) -> bool:
    if not email:
        return False
    return email.strip().lower() in REVIEWER_EMAILS
