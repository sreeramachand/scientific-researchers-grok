from django.db import models


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
    year = models.PositiveIntegerField()
    doi = models.CharField(max_length=80, blank=True)
    sku = models.CharField(max_length=80, unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    abstract = models.TextField()
    pdf_filename = models.CharField(max_length=160, help_text="File name inside frontend/public/papers/")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "title"]

    def __str__(self) -> str:
        return self.title
