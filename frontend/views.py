import json
from django.shortcuts import render
from .pitch_shifter import apply_pitch_shift, download_youtube_audio
from django.http import FileResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.temp import NamedTemporaryFile


# Create your views here.
def index(request, *args, **kwargs):
    return render(request, "frontend/index.html")


@csrf_exempt
def serve_wav_file(request):
    try:
        if request.method == "POST":
            # YoutubeのURLからmp3を抽出
            data = json.loads(request.body.decode("utf-8"))
            received_text = data.get("text", "")

            if received_text is None or received_text == "":
                raise Exception("URL must be entered.")

            if data.get("pitch", None) is None:
                raise Exception("Pitch must be selected.")

            pitch = int(data.get("pitch", None))
            input_file = NamedTemporaryFile(suffix=".wav")
            input_file_path = input_file.name
            try:
                download_youtube_audio(received_text, input_file_path.rstrip(".wav"))
            except Exception as e:
                raise Exception("The URL is not a valid YouTube link or ID.")

            # pitchを変更
            output_file = NamedTemporaryFile(suffix=".wav")
            output_file_path = output_file.name
            try:
                apply_pitch_shift(input_file_path, output_file_path, n_steps=pitch)
            except Exception as e:
                raise Exception("Something went wrong. Please try again.")

            # フロントエンドにファイルを返却
            return FileResponse(
                open(output_file_path, "rb"),
                content_type="audio/wav",
                as_attachment=True,
                filename=output_file_path,
            )

        return FileResponse({"error": "Invalid request method"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
