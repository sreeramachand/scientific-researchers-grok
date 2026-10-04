"""Private LaTeX PDFs. Stored beside private papers, never as a public static file."""

from pathlib import Path
from uuid import uuid4

from django.conf import settings

LATEX_MARKERS = (
    b"pdfTeX",
    b"XeTeX",
    b"LuaHBTeX",
    b"LuaTeX",
    b"MiKTeX",
    b"LaTeX",
    b"TeX Live",
)
MAX_BYTES = 20 * 1024 * 1024


def is_latex_pdf(data: bytes) -> bool:
    if not data.startswith(b"%PDF-"):
        return False
    head = data[:262144]
    return any(marker in head for marker in LATEX_MARKERS)


def save_submission_pdf(data: bytes) -> str:
    root = Path(settings.SUBMISSION_FILES_ROOT).resolve()
    root.mkdir(parents=True, exist_ok=True)
    name = f"{uuid4().hex}.pdf"
    path = (root / name).resolve()
    if path.parent != root:
        raise ValueError("Refusing to store a submission outside the private directory.")
    path.write_bytes(data)
    return name


def resolve_submission_file(filename: str) -> Path | None:
    if not filename or Path(filename).name != filename:
        return None
    root = Path(settings.SUBMISSION_FILES_ROOT).resolve()
    path = (root / filename).resolve()
    if path.parent != root or not path.is_file():
        return None
    return path
