import os
import yt_dlp
import librosa
import soundfile as sf
from pydub import AudioSegment
from django.core.files.temp import NamedTemporaryFile


# 1. yt-dlpでYouTube音声をダウンロードしてWAV形式に変換
def download_youtube_audio(url, output_file):
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": f"{output_file}.%(ext)s",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    print(f"WAV形式で保存しました: {output_file}")


def apply_pitch_shift(input_file, output_file, n_steps, n_fft=2048, hop_length=512):
    """
    任意のオーディオ形式に対応したピッチシフト処理を行う関数

    :param input_file: 入力ファイルのパス
    :param output_file: 出力ファイルのパス
    :param n_steps: ピッチシフトする半音の数
    :param n_fft: FFTのウィンドウサイズ
    :param hop_length: ストライド（移動間隔）
    """
    # 入力ファイルの拡張子を取得
    input_extension = os.path.splitext(input_file)[1].lower()

    # 入力ファイルを AudioSegment で読み込む
    audio = AudioSegment.from_file(input_file)

    # WAV に変換して一時保存
    temp_wav_file = NamedTemporaryFile(suffix=".wav").name
    audio.export(temp_wav_file, format="wav")

    # WAV ファイルを librosa で読み込む
    y, sr = librosa.load(temp_wav_file, sr=None)

    # ピッチシフトを適用
    y_shifted = librosa.effects.pitch_shift(
        y=y, sr=sr, n_steps=n_steps, n_fft=n_fft, hop_length=hop_length
    )

    # ピッチシフト後の WAV を保存
    shifted_wav_file = NamedTemporaryFile(suffix=".wav").name
    sf.write(shifted_wav_file, y_shifted, sr)

    # 元の形式に変換して出力
    shifted_audio = AudioSegment.from_file(shifted_wav_file, format="wav")
    shifted_audio.export(
        output_file, format=input_extension[1:]
    )  # 拡張子を使用して元の形式に戻す

    print(f"ピッチシフト後の音声を保存しました: {output_file}")


# オーディオファイルを切り取る
def clip_audio_file(input_file, output_file, start_time, end_time):
    # オーディオを読み込む
    y, sr = librosa.load(input_file, sr=None)

    # サンプル単位で切り取る
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    clipped_audio = y[start_sample:end_sample]

    # 切り取ったオーディオを保存
    sf.write(output_file, clipped_audio, sr)


# オーディオファイルかどうかチェックする
def is_audio_file(file_path):
    try:
        # AudioSegment でファイルを読み込む
        AudioSegment.from_file(file_path)
        return True
    except Exception:
        return False