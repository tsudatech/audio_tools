from django.urls import path
from rest_framework import routers
from .views import *

router = routers.DefaultRouter()
# router.register("api/users", UserViewSet)

urlpatterns = [
    path("", index, name="frontend"),
    path("chorder/", index, name="frontend"),
    path("strudeler/", index, name="frontend"),
] + router.urls
