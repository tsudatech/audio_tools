import os
import json
import mimetypes
from django.shortcuts import render
from .py_src.utils.audio_util import apply_pitch_shift, clip_audio_file, is_audio_file
from .py_src.utils.image_util import get_contours, image_clip
from django.http import FileResponse
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.temp import NamedTemporaryFile
from rest_framework.decorators import api_view
from .serializers import (
    FileUploadSerializer,
    AudioClipSerializer,
    ImageContourSerializer,
    ImageClipSerializer,
)


# Create your views here.
def index(request, *args, **kwargs):
    return render(request, "frontend/index.html")


@api_view(["POST"])
@csrf_exempt
def serve_wav_file(request):
    try:
        if request.method == "POST":
            serializer = FileUploadSerializer(data=request.data)

            # シリアライズが成功した場合
            if not serializer.is_valid():
                if "file" in serializer.errors:
                    raise Exception("Audio file must be selected.")

                if "pitch" in serializer.errors:
                    raise Exception("Pitch must be selected.")

            # ファイルとpitchの値を取得
            file = serializer.validated_data["file"]
            pitch = serializer.validated_data["pitch"]

            file_name, file_extension = os.path.splitext(file.name)
            input_file = NamedTemporaryFile(suffix=file_extension)
            input_file_path = input_file.name

            # openでファイルをローカルに保存
            with open(input_file_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            # 音声ファイルかどうかをチェックする
            if not is_audio_file(input_file_path):
                raise Exception("Selected file is not a audio file.")

            # pitchを変更
            output_file = NamedTemporaryFile(suffix=file_extension)
            output_file_path = output_file.name

            try:
                apply_pitch_shift(input_file_path, output_file_path, n_steps=pitch)
            except Exception as e:
                print(e)
                raise Exception("Something went wrong. Please try again.")

            # フロントエンドにファイルを返却
            content_type, _ = mimetypes.guess_type(output_file_path)
            if content_type is None:
                content_type = "application/octet-stream"

            return FileResponse(
                open(output_file_path, "rb"),
                content_type=content_type,
                as_attachment=True,
                filename=file_name,
            )

        return FileResponse({"error": "Invalid request method"}, status=400)
    except Exception as e:
        error = str(e)
        if "DATA_UPLOAD_MAX_MEMORY_SIZE" in str(
            e
        ) or "FILE_UPLOAD_MAX_MEMORY_SIZE" in str(e):
            error = "The file is too large. Please select a file under 10MB."
        return JsonResponse({"error": error}, status=400)


@api_view(["POST"])
@csrf_exempt
def clip_audio(request):
    try:
        if request.method == "POST":
            serializer = AudioClipSerializer(data=request.data)

            # シリアライズが成功した場合
            if not serializer.is_valid():
                if "file" in serializer.errors:
                    raise Exception("Audio file must be selected.")

            # ファイルとpitchの値を取得
            file = serializer.validated_data["file"]
            start = serializer.validated_data["start"]
            end = serializer.validated_data["end"]

            file_name, file_extension = os.path.splitext(file.name)
            input_file = NamedTemporaryFile(suffix=file_extension)
            input_file_path = input_file.name

            # openでファイルをローカルに保存
            with open(input_file_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            # 音声ファイルかどうかをチェックする
            if not is_audio_file(input_file_path):
                raise Exception("Selected file is not a audio file.")

            # pitchを変更
            output_file = NamedTemporaryFile(suffix=file_extension)
            output_file_path = output_file.name

            try:
                clip_audio_file(input_file_path, output_file_path, start, end)
            except Exception as e:
                print(e)
                raise Exception("Something went wrong. Please try again.")

            # フロントエンドにファイルを返却
            content_type, _ = mimetypes.guess_type(output_file_path)
            if content_type is None:
                content_type = "application/octet-stream"

            return FileResponse(
                open(output_file_path, "rb"),
                content_type=content_type,
                as_attachment=True,
                filename=file_name,
            )

        return FileResponse({"error": "Invalid request method"}, status=400)
    except Exception as e:
        error = str(e)
        if "DATA_UPLOAD_MAX_MEMORY_SIZE" in str(
            e
        ) or "FILE_UPLOAD_MAX_MEMORY_SIZE" in str(e):
            error = "The file is too large. Please select a file under 10MB."
        return JsonResponse({"error": error}, status=400)


@api_view(["POST"])
@csrf_exempt
def get_image_contours(request):
    try:
        if request.method == "POST":
            serializer = ImageContourSerializer(data=request.data)

            # シリアライズが成功した場合
            if not serializer.is_valid():
                if "file" in serializer.errors:
                    raise Exception("Image file must be selected.")

            # ファイルとpitchの値を取得
            file = serializer.validated_data["file"]
            file_name, file_extension = os.path.splitext(file.name)
            input_file = NamedTemporaryFile(suffix=file_extension)
            input_file_path = input_file.name

            # openでファイルをローカルに保存
            with open(input_file_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            try:
                contours = get_contours(input_file_path)
                temp = []
                for contour in contours:
                    temp.append(contour.tolist())
            except Exception as e:
                print(e)
                raise Exception("Something went wrong. Please try again.")

            return JsonResponse({"contours": json.dumps(temp)}, status=200)

        return JsonResponse({"error": "Invalid request method"}, status=400)
    except Exception as e:
        print(e)
        error = str(e)
        if "DATA_UPLOAD_MAX_MEMORY_SIZE" in str(
            e
        ) or "FILE_UPLOAD_MAX_MEMORY_SIZE" in str(e):
            error = "The file is too large. Please select a file under 10MB."
        return JsonResponse({"error": error}, status=400)


@api_view(["POST"])
@csrf_exempt
def clip_image(request):
    try:
        if request.method == "POST":
            serializer = ImageClipSerializer(data=request.data)

            # シリアライズが成功した場合
            if not serializer.is_valid():
                if "file" in serializer.errors:
                    raise Exception("Image file must be selected.")

                if "contours" in serializer.errors:
                    raise Exception("contours must be drawn to clip.")

            # ファイルとpitchの値を取得
            file = serializer.validated_data["file"]
            file_name, file_extension = os.path.splitext(file.name)
            input_file = NamedTemporaryFile(suffix=file_extension)
            input_file_path = input_file.name

            # openでファイルをローカルに保存
            with open(input_file_path, "wb") as f:
                for chunk in file.chunks():
                    f.write(chunk)

            output_file = NamedTemporaryFile(suffix=file_extension)
            output_file_path = output_file.name

            try:
                contours = serializer.validated_data["contours"]
                contours = json.loads(contours)
                image_clip(input_file_path, output_file_path, contours)
            except Exception as e:
                print(e)
                raise Exception("Something went wrong. Please try again.")

            # フロントエンドにファイルを返却
            content_type, _ = mimetypes.guess_type(output_file_path)
            if content_type is None:
                raise Exception("Content-Type of uploaded file does not exist.")

            return FileResponse(
                open(output_file_path, "rb"),
                content_type=content_type,
                as_attachment=True,
                filename=file_name,
            )

        return JsonResponse({"error": "Invalid request method"}, status=400)
    except Exception as e:
        print(e)
        error = str(e)
        if "DATA_UPLOAD_MAX_MEMORY_SIZE" in str(
            e
        ) or "FILE_UPLOAD_MAX_MEMORY_SIZE" in str(e):
            error = "The file is too large. Please select a file under 10MB."
        return JsonResponse({"error": error}, status=400)
