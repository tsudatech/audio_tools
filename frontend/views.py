import os
from django.shortcuts import render
from rest_framework import viewsets
from .serializers import UserSerializer
from .models import Users
from django.conf import settings
from .pitch_shifter import apply_pitch_shift


# Create your views here.
def index(request, *args, **kwargs):
    return render(request, "frontend/index.html")


class UserViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    input_path = os.path.join(settings.BASE_DIR, "staticfiles", "downloaded_audio.wav")
    output_path = os.path.join(
        settings.BASE_DIR, "staticfiles", "downloaded_audio2.wav"
    )
    # apply_pitch_shift(input_path, output_path, n_steps=2)
    print("pitch_shift done.")

    serializer_class = UserSerializer
