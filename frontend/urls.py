from django.urls import path
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
# router.register("api/users", UserViewSet)

urlpatterns = [
    path("", index, name="frontend"),
    # Pitch Shifter
    path("pitch-shifter/", index, name="frontend"),
    path("chord-progression-manager/", index, name="frontend"),
    path("audio-clipper/", index, name="frontend"),
    path("wood-blocks/", index, name="frontend"),
    path("api/serve-wav/", serve_wav_file, name="serve_wav"),
    path("api/clip-audio/", clip_audio, name="clip_audio"),
] + router.urls
