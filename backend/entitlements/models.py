from django.conf import settings
from django.db import models

from papers.models import Paper


class Entitlement(models.Model):
    class Source(models.TextChoices):
        PAPER = "paper", "Individual paper"
        SUBSCRIPTION = "subscription", "Subscription"
        COMP = "comp", "Complimentary"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="entitlements")
    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name="entitlements")
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.PAPER)
    snipcart_invoice = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "paper")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user} → {self.paper.sku}"


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELED = "canceled", "Canceled"
        PAST_DUE = "past_due", "Past due"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription")
    sku = models.CharField(max_length=80)
    name = models.CharField(max_length=120)
    interval = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    snipcart_subscription_id = models.CharField(max_length=120, blank=True)
    renews_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.user} · {self.name} · {self.status}"
