from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from papers.models import Paper

from .models import Entitlement, Subscription
from .serializers import EntitlementSerializer, SubscriptionSerializer
from .snipcart import order_is_paid, paper_ids, secret_configured, token_is_valid


class EntitlementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Entitlement.objects.filter(user=request.user).select_related("paper")
        return Response(EntitlementSerializer(items, many=True).data)


class AccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sku = request.query_params.get("sku", "")
        subscription = getattr(request.user, "subscription", None)
        if subscription and subscription.status == Subscription.Status.ACTIVE:
            return Response({"access": True, "reason": "subscription"})
        paper = Paper.objects.filter(sku=sku).first()
        entitled = bool(paper and Entitlement.objects.filter(user=request.user, paper=paper).exists())
        return Response({"access": entitled, "reason": "paper" if entitled else "none"})


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


@method_decorator(csrf_exempt, name="dispatch")
class SnipcartWebhookView(APIView):
    """Record a paid project PDF after Snipcart confirms the order.

    Without ``SNIPCART_API_KEY`` the endpoint refuses the call. Checkout in the
    browser still uses the public key; this view only stores a verified order.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        if not secret_configured():
            return Response(
                {
                    "detail": (
                        "Server-side Snipcart order verification requires the secret "
                        "API key SNIPCART_API_KEY on the server. It is not configured."
                    )
                },
                status=503,
            )
        token = request.headers.get("X-Snipcart-RequestToken", "")
        if not token_is_valid(token):
            return Response({"detail": "Unverified Snipcart request."}, status=401)

        payload = request.data if isinstance(request.data, dict) else {}
        event = payload.get("eventName")
        if event != "order.completed":
            return Response({"ok": True, "ignored": event})

        content = payload.get("content") if isinstance(payload.get("content"), dict) else {}
        if not order_is_paid(content):
            return Response({"ok": True, "ignored": content.get("paymentStatus")})

        email = str(content.get("email") or "").strip()
        if not email:
            return Response({"detail": "Order is missing a customer email."}, status=400)

        invoice = str(content.get("invoiceNumber") or content.get("token") or "")
        user = user_for_order_email(email)
        granted = []
        for sku in paper_ids(content):
            paper = Paper.objects.filter(sku=sku, is_published=True).first()
            if not paper:
                continue
            Entitlement.objects.update_or_create(
                user=user,
                paper=paper,
                defaults={
                    "source": Entitlement.Source.PAPER,
                    "snipcart_invoice": invoice[:120],
                },
            )
            granted.append(sku)
        return Response({"ok": True, "granted": granted})


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = getattr(request.user, "subscription", None)
        if not subscription:
            return Response({"subscription": None})
        return Response({"subscription": SubscriptionSerializer(subscription).data})
