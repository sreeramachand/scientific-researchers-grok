import uuid

from django.db import models


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    submitter_email = models.EmailField(db_index=True)
    submitter_name = models.CharField(max_length=120)
    title = models.CharField(max_length=200, blank=True)
    original_filename = models.CharField(max_length=180)
    stored_filename = models.CharField(max_length=80, unique=True)
    notification_sent = models.BooleanField(default=False)
    notification_error = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title or self.original_filename
