from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Paper
from .serializers import PaperSerializer


class PaperViewSet(ReadOnlyModelViewSet):
    """Published papers only. Uploads stay out of this database until a later publish step."""

    serializer_class = PaperSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Paper.objects.matching(self.request.query_params.get("q", ""))
