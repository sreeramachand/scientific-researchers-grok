from django.urls import path

from .views import RsvpCreateView, RsvpListView, SessionListView

urlpatterns = [
    path("sessions/", SessionListView.as_view()),
    path("rsvp/", RsvpCreateView.as_view()),
    path("rsvps/", RsvpListView.as_view()),
]
