from django.contrib import admin

from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("title", "submitter_email", "notification_sent", "created_at")
    search_fields = ("title", "submitter_email", "submitter_name")
