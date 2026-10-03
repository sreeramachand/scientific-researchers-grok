import secrets

from django.http import FileResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from papers.models import Paper

from .files import resolve_paper_file
from .models import Entitlement, Subscription
from .purchases import PurchaseError, record_purchase, user_for_order_email
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

        invoice = str(content.get("invoiceNumber") or "")
        order_token = str(content.get("token") or "")[:80]
        user = user_for_order_email(email)
        granted = []
        for sku in paper_ids(content):
            paper = Paper.objects.filter(sku=sku, is_published=True).first()
            if not paper:
                continue
            defaults = {
                "source": Entitlement.Source.PAPER,
                "snipcart_invoice": invoice[:120],
            }
            if order_token:
                defaults["snipcart_order_token"] = order_token
            entitlement, _created = Entitlement.objects.update_or_create(
                user=user,
                paper=paper,
                defaults=defaults,
            )
            if not entitlement.access_token:
                entitlement.access_token = secrets.token_urlsafe(32)
                entitlement.save(update_fields=["access_token"])
            granted.append(sku)
        return Response({"ok": True, "granted": granted})


@method_decorator(csrf_exempt, name="dispatch")
class PurchaseView(APIView):
    """Save a completed checkout for the signed-in buyer and return a download token.

    With ``SNIPCART_API_KEY`` set, the order is confirmed with Snipcart first.
    Without that secret, the signed-in checkout is still recorded so the buyer
    can open the PDF. Callers who have not purchased receive no token.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        try:
            entitlement = record_purchase(
                email=str(payload.get("email") or ""),
                sku=str(payload.get("sku") or ""),
                order_token=str(payload.get("orderToken") or payload.get("order_token") or ""),
                invoice=str(payload.get("invoiceNumber") or payload.get("invoice_number") or ""),
            )
        except PurchaseError as error:
            return Response({"detail": error.detail}, status=error.status)
        return Response(
            {
                "sku": entitlement.paper.sku,
                "title": entitlement.paper.title,
                "access_token": entitlement.access_token,
            }
        )


@xframe_options_sameorigin
def paper_file(request, sku: str):
    """Serve a full PDF only to the buyer who holds that purchase's access token."""
    token = (request.GET.get("access") or "").strip()
    if len(token) < 20:
        return HttpResponse("This PDF is available after purchase.", status=403, content_type="text/plain")
    entitlement = (
        Entitlement.objects.filter(access_token=token, paper__sku=sku, paper__is_published=True)
        .select_related("paper")
        .first()
    )
    if entitlement is None:
        return HttpResponse("This PDF is available after purchase.", status=403, content_type="text/plain")
    path = resolve_paper_file(entitlement.paper.pdf_filename)
    if path is None:
        return HttpResponse("This PDF is not available.", status=404, content_type="text/plain")
    response = FileResponse(path.open("rb"), content_type="application/pdf")
    disposition = "attachment" if request.GET.get("download") == "1" else "inline"
    response["Content-Disposition"] = f'{disposition}; filename="{path.name}"'
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    response["Referrer-Policy"] = "no-referrer"
    return response


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = getattr(request.user, "subscription", None)
        if not subscription:
            return Response({"subscription": None})
        return Response({"subscription": SubscriptionSerializer(subscription).data})
