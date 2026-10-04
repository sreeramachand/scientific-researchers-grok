from django.db import models
from django.db.models import Q


class PaperQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def matching(self, query: str):
        text = (query or "").strip()
        published = self.published()
        if not text:
            return published
        text_hits = published.filter(
            Q(title__icontains=text) | Q(authors__icontains=text) | Q(abstract__icontains=text)
        )
        folded = text.casefold()
        keyword_ids = [
            paper.pk
            for paper in published.exclude(pk__in=text_hits.values("pk"))
            if any(folded in str(word).casefold() for word in (paper.keywords or []))
        ]
        if not keyword_ids:
            return text_hits
        return published.filter(Q(pk__in=text_hits.values("pk")) | Q(pk__in=keyword_ids))


class Paper(models.Model):
    class Category(models.TextChoices):
        BIOMEDICAL_AI = "biomedical-ai", "Biomedical AI"
        VISUAL = "visual", "Visual"
        CANCER = "cancer", "Cancer"

    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=32, choices=Category.choices)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=240, blank=True)
    authors = models.CharField(max_length=300)
    year = models.PositiveIntegerField(blank=True, null=True)
    doi = models.CharField(max_length=80, blank=True)
    sku = models.CharField(max_length=80, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    abstract = models.TextField()
    keywords = models.JSONField(default=list, blank=True)
    pdf_filename = models.CharField(max_length=160, help_text="File name inside backend/private_papers/")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PaperQuerySet.as_manager()

    class Meta:
        ordering = ["category", "title"]

    def __str__(self) -> str:
        return self.title
