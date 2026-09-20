from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly

from .models import Paper
from .serializers import PaperSerializer


class PaperViewSet(viewsets.ModelViewSet):
    queryset = Paper.objects.filter(is_published=True)
    serializer_class = PaperSerializer
    lookup_field = "slug"
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return super().get_permissions()
