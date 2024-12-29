import yt_dlp
import librosa
import soundfile as sf


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


# 短いFFTサイズとホップサイズを指定
n_fft = 1024  # デフォルトは2048
hop_length = 128  # デフォルトはn_fft // 4


# 2. librosaでピッチシフトを適用
def apply_pitch_shift(input_file, output_file, n_steps):
    y, sr = librosa.load(input_file, sr=None)
    y_shifted = librosa.effects.pitch_shift(
        y=y, sr=sr, n_steps=n_steps, n_fft=n_fft, hop_length=hop_length
    )
    sf.write(output_file, y_shifted, sr)
    print(f"ピッチシフト後の音声を保存しました: {output_file}")
