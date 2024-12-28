from django.urls import path
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
# router.register("api/users", UserViewSet)

urlpatterns = [
    path("", index, name="frontend"),
    path("serve-wav/", serve_wav_file, name="serve_wav"),
] + router.urls
