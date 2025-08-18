from rest_framework import serializers


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド
    pitch = serializers.IntegerField()  # pitchを追加（整数）


class AudioClipSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド
    start = serializers.IntegerField()
    end = serializers.IntegerField()


class ImageContourSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド


class ImageClipSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド
    contours = serializers.CharField()
