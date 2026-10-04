from django.contrib import admin

from .models import SessionRsvp


@admin.register(SessionRsvp)
class SessionRsvpAdmin(admin.ModelAdmin):
    list_display = ("session_id", "name", "email", "notification_sent", "created_at")
    search_fields = ("name", "email", "message", "session_id")
