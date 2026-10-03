"""Snipcart order checks for project-PDF purchases.

The public API key runs checkout in the browser. This module uses the secret
API key (``SNIPCART_API_KEY``) to confirm that a webhook or validation token
really came from Snipcart. The secret is never read from the repository.
"""

from __future__ import annotations

import base64
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

VALIDATION_URL = "https://app.snipcart.com/api/requestvalidation/{token}"
PAID_STATUSES = {"Paid", "Authorized", "Deferred", "PaidDeferred"}


def secret_configured() -> bool:
    return bool(getattr(settings, "SNIPCART_API_KEY", "").strip())


def token_is_valid(token: str, opener=urllib.request.urlopen) -> bool:
    secret = getattr(settings, "SNIPCART_API_KEY", "").strip()
    if not secret or not token:
        return False
    url = VALIDATION_URL.format(token=urllib.parse.quote(token, safe=""))
    auth = base64.b64encode(f"{secret}:".encode()).decode("ascii")
    request = urllib.request.Request(
        url,
        headers={"Authorization": f"Basic {auth}", "Accept": "application/json"},
        method="GET",
    )
    try:
        with opener(request, timeout=10) as response:
            status = getattr(response, "status", None) or getattr(response, "code", None)
            return status == 200
    except urllib.error.HTTPError:
        return False
    except urllib.error.URLError:
        return False


def order_is_paid(content: dict) -> bool:
    status = content.get("paymentStatus")
    if not status:
        return True
    return status in PAID_STATUSES


def paper_ids(content: dict) -> list[str]:
    items = content.get("items") or []
    ids: list[str] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        sku = str(item.get("id") or "")
        if sku.startswith("paper-"):
            ids.append(sku)
    return ids
