from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ["id", "username", "display_name", "email", "billing_email", "neon_user_id"]
        read_only_fields = ["neon_user_id"]
