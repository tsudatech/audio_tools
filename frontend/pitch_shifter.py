import yt_dlp
import librosa
import soundfile as sf

# # YouTubeのURL
# youtube_url = "https://www.youtube.com/watch?v=h-kQw4JqCHE"

# # ダウンロード先のWAVファイル
# output_filename = "downloaded_audio"

# # ピッチシフト後のファイル
# pitch_shifted_filename = "pitch_shifted_audio.wav"


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


# 2. librosaでピッチシフトを適用
def apply_pitch_shift(input_file, output_file, n_steps):
    y, sr = librosa.load(input_file, sr=None)
    y_shifted = librosa.effects.pitch_shift(y=y, sr=sr, n_steps=n_steps)
    sf.write(output_file, y_shifted, sr)
    print(f"ピッチシフト後の音声を保存しました: {output_file}")


# 実行
# download_youtube_audio(youtube_url, output_filename)
# apply_pitch_shift(output_filename + ".wav", pitch_shifted_filename, n_steps=2)  # +2で2半音上げる
