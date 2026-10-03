from django.urls import path

from .views import AccessView, EntitlementListView, PurchaseView, SnipcartWebhookView, SubscriptionView, paper_file

urlpatterns = [
    path("", EntitlementListView.as_view(), name="entitlement-list"),
    path("access/", AccessView.as_view(), name="entitlement-access"),
    path("subscription/", SubscriptionView.as_view(), name="entitlement-subscription"),
    path("purchases/", PurchaseView.as_view(), name="purchase-confirm"),
    path("papers/<slug:sku>/file/", paper_file, name="paper-file"),
    path("snipcart/webhook/", SnipcartWebhookView.as_view(), name="snipcart-webhook"),
]
