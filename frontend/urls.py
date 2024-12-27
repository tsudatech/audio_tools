from django.urls import path
from rest_framework import routers
from .views import index
from .views import UserViewSet

router = routers.DefaultRouter()
router.register("api/users", UserViewSet)

urlpatterns = [path("", index, name="frontend")] + router.urls
