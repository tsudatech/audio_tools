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
    path("image-clipper/", index, name="frontend"),
    path("api/serve-wav/", serve_wav_file, name="serve_wav"),
    path("api/clip-audio/", clip_audio, name="clip_audio"),
    path("api/get-image-contours/", get_image_contours, name="get_image_contours"),
    path("api/clip-image/", clip_image, name="clip_image"),
] + router.urls
