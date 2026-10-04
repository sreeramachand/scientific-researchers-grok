"""Information sessions. Meet links stay on the server until an RSVP is saved."""

SESSIONS = (
    {
        "id": "2026-11-20",
        "date": "2026-11-20",
        "label": "Friday, November 20, 2026",
        "starts": "19:00",
        "ends": "20:00",
        "timezone": "America/New_York",
        "time_label": "7:00–8:00 PM ET",
        "meet_url": "https://meet.google.com/nci-zpkx-kny",
    },
    {
        "id": "2026-12-18",
        "date": "2026-12-18",
        "label": "Friday, December 18, 2026",
        "starts": "19:00",
        "ends": "20:00",
        "timezone": "America/New_York",
        "time_label": "7:00–8:00 PM ET",
        "meet_url": "https://meet.google.com/ibw-nvso-kez",
    },
    {
        "id": "2027-01-22",
        "date": "2027-01-22",
        "label": "Friday, January 22, 2027",
        "starts": "19:00",
        "ends": "20:00",
        "timezone": "America/New_York",
        "time_label": "7:00–8:00 PM ET",
        "meet_url": "https://meet.google.com/nca-svab-ipz",
    },
)

BY_ID = {session["id"]: session for session in SESSIONS}


def public_session(session: dict) -> dict:
    return {
        "id": session["id"],
        "date": session["date"],
        "label": session["label"],
        "starts": session["starts"],
        "ends": session["ends"],
        "timezone": session["timezone"],
        "time_label": session["time_label"],
    }
