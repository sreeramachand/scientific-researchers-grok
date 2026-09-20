from django.contrib import admin

from .models import Paper


@admin.register(Paper)
class PaperAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "sku", "price", "year", "is_published")
    list_filter = ("category", "is_published", "year")
    search_fields = ("title", "slug", "sku", "doi")
