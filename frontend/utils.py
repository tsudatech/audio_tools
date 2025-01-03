from pydub import AudioSegment


def is_audio_file(file_path):
    try:
        # AudioSegment でファイルを読み込む
        AudioSegment.from_file(file_path)
        return True
    except Exception:
        return False
