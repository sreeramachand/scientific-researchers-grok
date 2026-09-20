from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from papers.models import Paper

from .models import Entitlement, Subscription
from .serializers import EntitlementSerializer, SubscriptionSerializer


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


class SubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = getattr(request.user, "subscription", None)
        if not subscription:
            return Response({"subscription": None})
        return Response({"subscription": SubscriptionSerializer(subscription).data})
