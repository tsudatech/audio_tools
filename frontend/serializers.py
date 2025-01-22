from rest_framework import serializers


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド
    pitch = serializers.IntegerField()  # pitchを追加（整数）

class AudioClipSerializer(serializers.Serializer):
    file = serializers.FileField()  # ファイルフィールド
    start = serializers.IntegerField()
    end = serializers.IntegerField()