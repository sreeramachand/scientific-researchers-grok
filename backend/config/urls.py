from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"ok": True, "service": "scientific-researchers-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/papers/", include("papers.urls")),
    path("api/profile/", include("profiles.urls")),
    path("api/entitlements/", include("entitlements.urls")),
    path("api/webinars/", include("webinars.urls")),
    path("api/submissions/", include("submissions.urls")),
]
