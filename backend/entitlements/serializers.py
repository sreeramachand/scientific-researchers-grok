from rest_framework import serializers

from .models import Entitlement, Subscription


class EntitlementSerializer(serializers.ModelSerializer):
    paper_slug = serializers.CharField(source="paper.slug", read_only=True)
    paper_title = serializers.CharField(source="paper.title", read_only=True)
    sku = serializers.CharField(source="paper.sku", read_only=True)

    class Meta:
        model = Entitlement
        fields = ["id", "paper", "paper_slug", "paper_title", "sku", "source", "snipcart_invoice", "created_at"]
        read_only_fields = ["created_at"]


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "sku", "name", "interval", "status", "snipcart_subscription_id", "renews_on"]
