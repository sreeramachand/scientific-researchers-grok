from django.contrib import admin

from .models import Entitlement, Subscription


@admin.register(Entitlement)
class EntitlementAdmin(admin.ModelAdmin):
    list_display = ("user", "paper", "source", "created_at")
    list_filter = ("source",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "sku", "status", "renews_on")
    list_filter = ("status",)
