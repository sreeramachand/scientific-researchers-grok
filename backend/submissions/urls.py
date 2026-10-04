from django.urls import path

from .views import SubmissionFileView, SubmissionListCreateView

urlpatterns = [
    path("", SubmissionListCreateView.as_view()),
    path("<uuid:pk>/file/", SubmissionFileView.as_view()),
]
