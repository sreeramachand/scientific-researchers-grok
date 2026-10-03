"""Record a completed paper purchase and remember who may download it.

When ``SNIPCART_API_KEY`` is set, the order token is checked with Snipcart
before a download token is issued. When it is unset, a signed-in checkout
confirmation still records the purchase so the buyer can open the file. The
PDF itself is never placed on a public URL.
"""

from __future__ import annotations

import secrets

from django.contrib.auth import get_user_model

from papers.models import Paper

from .models import Entitlement
from .snipcart import fetch_order, order_grants_sku, secret_configured


def user_for_order_email(email: str):
    User = get_user_model()
    normalized = email.strip().lower()
    existing = User.objects.filter(email__iexact=normalized).first()
    if existing:
        return existing
    local = normalized.split("@", 1)[0]
    base = "".join(char for char in local if char.isalnum() or char in "._-")[:30] or "reader"
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base[:20]}-{suffix}"
    user = User(username=username, email=normalized)
    user.set_unusable_password()
    user.save()
    return user


class PurchaseError(Exception):
    def __init__(self, detail: str, status: int):
        super().__init__(detail)
        self.detail = detail
        self.status = status


def record_purchase(*, email: str, sku: str, order_token: str, invoice: str = "", opener=None) -> Entitlement:
    normalized = email.strip().lower()
    sku = sku.strip()
    order_token = order_token.strip()
    if "@" not in normalized or not sku or len(order_token) < 8:
        raise PurchaseError("A completed purchase for a signed-in account is required.", 400)

    paper = Paper.objects.filter(sku=sku, is_published=True).first()
    if paper is None:
        raise PurchaseError("Unknown paper.", 404)

    if secret_configured():
        order = fetch_order(order_token, opener=opener) if opener else fetch_order(order_token)
        if not order or not order_grants_sku(order, sku):
            raise PurchaseError("This purchase could not be confirmed.", 403)
        invoice = invoice or str(order.get("invoiceNumber") or "")

    claimed = (
        Entitlement.objects.filter(paper=paper, snipcart_order_token=order_token[:80])
        .select_related("user")
        .first()
    )
    if claimed and claimed.user.email.lower() != normalized:
        raise PurchaseError("This purchase is already attached to another account.", 403)

    user = user_for_order_email(normalized)
    entitlement, _created = Entitlement.objects.get_or_create(
        user=user,
        paper=paper,
        defaults={
            "source": Entitlement.Source.PAPER,
            "snipcart_invoice": invoice[:120],
            "snipcart_order_token": order_token[:80],
        },
    )
    if not entitlement.access_token:
        entitlement.access_token = secrets.token_urlsafe(32)
    if order_token and not entitlement.snipcart_order_token:
        entitlement.snipcart_order_token = order_token[:80]
    if invoice and not entitlement.snipcart_invoice:
        entitlement.snipcart_invoice = invoice[:120]
    entitlement.save()
    return entitlement
