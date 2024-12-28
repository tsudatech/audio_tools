import json
from django.shortcuts import render
from django.conf import settings
from .pitch_shifter import apply_pitch_shift, download_youtube_audio
from django.http import FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.temp import NamedTemporaryFile

# from rest_framework import viewsets
# from .serializers import UserSerializer
from .models import Users


# Create your views here.
def index(request, *args, **kwargs):
    return render(request, "frontend/index.html")


@csrf_exempt
def serve_wav_file(request):
    if request.method == "POST":
        # YoutubeのURLからmp3を抽出
        data = json.loads(request.body.decode("utf-8"))
        received_text = data.get("text", "")
        input_file = NamedTemporaryFile(suffix=".wav")
        input_file_path = input_file.name
        download_youtube_audio(received_text, input_file_path.rstrip(".wav"))

        # pitchを変更
        output_file = NamedTemporaryFile(suffix=".wav")
        output_file_path = output_file.name
        apply_pitch_shift(input_file_path, output_file_path, n_steps=2)

        # フロントエンドにファイルを返却
        return FileResponse(
            open(output_file_path, "rb"),
            content_type="audio/wav",
            as_attachment=True,
            filename=output_file_path,
        )

    return FileResponse({"error": "Invalid request method"}, status=400)


# class UserViewSet(viewsets.ModelViewSet):
#     queryset = Users.objects.all()
#     input_path = os.path.join(settings.BASE_DIR, "staticfiles", "downloaded_audio.wav")
#     output_path = os.path.join(
#         settings.BASE_DIR, "staticfiles", "downloaded_audio2.wav"
#     )
#     # apply_pitch_shift(input_path, output_path, n_steps=2)
#     print("pitch_shift done.")

#     serializer_class = UserSerializer
