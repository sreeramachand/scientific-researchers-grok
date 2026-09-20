from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile(self, request) -> Profile:
        profile, _ = Profile.objects.get_or_create(
            user=request.user,
            defaults={
                "username": request.user.get_username() or f"user-{request.user.pk}",
                "display_name": request.user.get_full_name() or request.user.get_username(),
                "billing_email": request.user.email,
            },
        )
        return profile

    def get(self, request):
        return Response(ProfileSerializer(self.get_profile(request)).data)

    def patch(self, request):
        serializer = ProfileSerializer(self.get_profile(request), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
