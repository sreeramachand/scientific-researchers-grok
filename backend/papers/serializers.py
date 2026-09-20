from rest_framework import serializers

from .models import Paper


class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = [
            "id",
            "slug",
            "category",
            "title",
            "subtitle",
            "authors",
            "year",
            "doi",
            "sku",
            "price",
            "abstract",
            "pdf_filename",
            "is_published",
        ]
