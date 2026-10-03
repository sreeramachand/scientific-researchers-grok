from django.urls import path

from .views import AccessView, EntitlementListView, SnipcartWebhookView, SubscriptionView

urlpatterns = [
    path("", EntitlementListView.as_view(), name="entitlement-list"),
    path("access/", AccessView.as_view(), name="entitlement-access"),
    path("subscription/", SubscriptionView.as_view(), name="entitlement-subscription"),
    path("snipcart/webhook/", SnipcartWebhookView.as_view(), name="snipcart-webhook"),
]
