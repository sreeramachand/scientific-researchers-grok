"""Mint Neon-shaped EdDSA JWTs for tests. Not used in production."""

import base64
import time
from contextlib import contextmanager
from unittest.mock import patch

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from django.test import override_settings

import jwt

from identity.neon_jwt import auth_origin, clear_jwks_cache

AUTH_BASE = "https://auth.example.test/neondb/auth"


def mint_token(email: str, name: str = "Ada Lovelace", *, base: str = AUTH_BASE) -> tuple[str, dict]:
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    x = base64.urlsafe_b64encode(public).decode().rstrip("=")
    origin = auth_origin(base)
    now = int(time.time())
    token = jwt.encode(
        {
            "iat": now,
            "exp": now + 600,
            "name": name,
            "email": email,
            "emailVerified": True,
            "sub": "user-1",
            "iss": origin,
            "aud": origin,
        },
        private,
        algorithm="EdDSA",
        headers={"kid": "test-key"},
    )
    jwks = {"keys": [{"kty": "OKP", "crv": "Ed25519", "kid": "test-key", "x": x}]}
    return token, jwks


@contextmanager
def verified_session(email: str, name: str = "Ada Lovelace"):
    token, jwks = mint_token(email, name)
    clear_jwks_cache()
    with override_settings(NEON_AUTH_BASE_URL=AUTH_BASE):
        with patch("identity.neon_jwt.fetch_jwks", return_value=jwks):
            yield token
    clear_jwks_cache()
