"""Verify a Neon Auth JWT from the set-auth-jwt /token flow.

The browser session cookie is on the Neon host, so this API checks the JWT
with the public JWKS at ``{NEON_AUTH_BASE_URL}/.well-known/jwks.json``.
Tokens are EdDSA. No shared secret is stored here.
"""

from __future__ import annotations

import base64
import json
import time
import urllib.request
from dataclasses import dataclass
from urllib.parse import urlparse

import jwt
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from django.conf import settings
from jwt import PyJWTError

_CACHE: dict[str, tuple[float, dict]] = {}
_TTL_SECONDS = 600


def clear_jwks_cache() -> None:
    _CACHE.clear()


def fetch_jwks(url: str) -> dict:
    now = time.time()
    cached = _CACHE.get(url)
    if cached and now - cached[0] < _TTL_SECONDS:
        return cached[1]
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=5) as response:
        payload = json.loads(response.read().decode())
    if not isinstance(payload, dict):
        raise ValueError("JWKS payload was not an object")
    _CACHE[url] = (now, payload)
    return payload


def _b64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def signing_key(token: str, jwks: dict) -> Ed25519PublicKey:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    for jwk in jwks.get("keys", []):
        if jwk.get("kid") != kid or jwk.get("kty") != "OKP":
            continue
        raw = _b64url(str(jwk.get("x") or ""))
        return Ed25519PublicKey.from_public_bytes(raw)
    raise ValueError("Matching JWK not found")


def auth_origin(base_url: str) -> str:
    parsed = urlparse(base_url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def validate_neon_token(token: str) -> dict | None:
    base = str(getattr(settings, "NEON_AUTH_BASE_URL", "") or "").strip().rstrip("/")
    if not base or not token or token.count(".") != 2:
        return None
    origin = auth_origin(base)
    if not origin:
        return None
    try:
        jwks = fetch_jwks(f"{base}/.well-known/jwks.json")
        key = signing_key(token, jwks)
        payload = jwt.decode(
            token,
            key=key,
            algorithms=["EdDSA"],
            issuer=origin,
            audience=origin,
        )
    except (PyJWTError, ValueError, OSError, json.JSONDecodeError, TimeoutError):
        return None
    return payload if isinstance(payload, dict) else None


@dataclass(frozen=True)
class Actor:
    email: str
    name: str


def actor_from_request(request) -> Actor | None:
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    payload = validate_neon_token(header[7:].strip())
    if not payload:
        return None
    email = payload.get("email")
    if not isinstance(email, str) or "@" not in email:
        return None
    email = email.strip().lower()
    name = payload.get("name")
    if not isinstance(name, str) or not name.strip():
        name = email.split("@", 1)[0]
    return Actor(email=email, name=name.strip()[:120])
