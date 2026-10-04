from django.db import models


class SessionRsvp(models.Model):
    session_id = models.CharField(max_length=32, db_index=True)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    notification_sent = models.BooleanField(default=False)
    notification_error = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.session_id} · {self.email}"
