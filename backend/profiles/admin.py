from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("username", "display_name", "billing_email", "neon_user_id")
    search_fields = ("username", "display_name", "neon_user_id")
