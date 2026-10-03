"""Resolve a purchased PDF inside the private papers directory."""

from pathlib import Path

from django.conf import settings


def resolve_paper_file(filename: str) -> Path | None:
    if not filename or Path(filename).name != filename:
        return None
    root = Path(settings.PAPER_FILES_ROOT).resolve()
    path = (root / filename).resolve()
    if path.parent != root or not path.is_file():
        return None
    return path
