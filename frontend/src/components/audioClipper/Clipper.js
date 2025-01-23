// App.js
import React, { useEffect, useRef, useState } from "react";
import ErrorMsg from "../common/ErrorMsg";
import ga from "../common/GAUtils";
import MultiRangeSlider from "../common/MultiRangeSlider";
import { formatTime, isAudioFile } from "../common/utils";
import { FaCirclePlay } from "react-icons/fa6";
import { FaGripLinesVertical } from "react-icons/fa";
import { IoPlaySkipBack } from "react-icons/io5";

const trackEvent = ga.trackEventBuilder("Clipper");

function Clipper() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [max, setMax] = useState(null);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minValueChanged, setMinValueChanged] = useState(false);
  const audioRef = useRef(null); // Audioタグの参照
  const audioEndedRef = useRef(null); // Audioタグの参照
  const min = 0;

  useEffect(() => {
    return () => {
      // クリーンアップ時にリスナーを削除
      if (audioRef.current && audioEndedRef.current) {
        audioRef.current.removeEventListener("ended", audioEndedRef.current);
      }
    };
  }, []);

  // オーディオファイルを切り取り、ダウンロードする
  function clipAudio(e) {
    trackEvent({ action: "clipAudio" });
    setLoading(true);
    setProgress(0);
    setError(null);

    // プログレスバーを進行させる
    const interval = setInterval(() => {
      setProgress((prev) => {
        const val = prev + 100 / 10;
        return val > 90 ? 90 : val;
      });
    }, 1000);

    // FormDataを作成
    const formData = new FormData();
    formData.append("file", file);
    formData.append("start", minValue);
    formData.append("end", maxValue);

    // 切り取り処理
    fetch("/api/clip-audio/", {
      method: "POST",
      body: formData,
      responseType: "blob", // バイナリデータとしてレスポンスを受け取る
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        return response.blob();
      })
      .then((blob) => {
        const audioUrl = window.URL.createObjectURL(blob); // ブラウザで再生可能な URL を作成
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const link = document.createElement("a"); // <a>要素を作成
        link.href = audioUrl; // オーディオの URL を設定
        link.download =
          name + `_${formatTime(minValue)}-${formatTime(maxValue)}`; // ダウンロードファイル名を設定
        link.click(); // 自動的にクリックしてダウンロードを開始
        link.remove();
      })
      .catch((error) => setError(error.message))
      .finally(() => {
        setLoading(false);
        clearInterval(interval);
      });
  }

  // 再生終了時の処理
  const onAudioEnded = () => {
    reset();
    setIsPlaying(false);
  };

  // 再生
  const play = (e) => {
    if (audioRef.current) {
      if (minValueChanged) {
        reset();
        setMinValueChanged(false);
      }
      audioRef.current.play(); // 再生
      setIsPlaying(true);

      audioRef.current.removeEventListener("ended", audioEndedRef.current);
      audioRef.current.addEventListener("ended", onAudioEnded);
      audioEndedRef.current = onAudioEnded;
    }
  };

  // 停止
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // 開始位置のリセット
  const reset = (e) => {
    if (audioRef.current) {
      audioRef.current.currentTime = minValue; // 開始位置を設定
      setCurrentTime(0);
      setTimeout(() => setStartTime((minValue / max) * 100), 5);
    }
  };

  // 再生中に現在の再生位置を更新
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const c = audioRef.current.currentTime; // 現在の再生位置を取得

      // maxに+1している関係で再生ゲージが最後まで到達しない問題の解消
      const addtional = max % 1 > 0.5 ? 2 : 1.5;
      const alpha = c >= max - addtional ? 1 : 0;
      setCurrentTime((Math.floor(c + alpha) / max) * 100);
    }
  };

  // オーディオファイルを読み込み、Preview用のスライダーを表示する
  const showSlider = (e) => {
    const target = e.target.files[0];
    if (!target) {
      return;
    }

    if (!isAudioFile(target)) {
      setError("The selected file is not an audio file.");
      return;
    }

    const url = URL.createObjectURL(target); // ファイルをURLに変換
    setAudioUrl(url); // URLをstateにセット
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();

      // 2つ目のファイルに備えて強制リセット
      audioRef.current.currentTime = 0; // 開始位置を設定
      setCurrentTime(0);
      setStartTime(0);
      setMinValue(0);
    }

    // 再生時間を取得
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      const duration = Math.floor(audio.duration + 1);
      setMax(duration);
      setMaxValue(duration);
    });

    setError(null);
    setFile(target);
    setFadeIn(false);
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  };

  /**
   * スペースキーで再生・停止
   * @param {*} event
   * @returns
   */
  const handleKeyDown = (event) => {
    if (!audioUrl) {
      return;
    }
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault(); // スクロールなどのデフォルト動作を防止
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: "none" }}>
      {/* ファイル選択 */}
      <div className="container w-full">
        <div className="card bg-neutral text-neutral-content w-full container pt-4 pb-4">
          {/* 本体 */}
          <p className="text font-bold">Please select audio file</p>
          <input
            type="file"
            onChange={showSlider}
            className="file-input file-input-bordered w-full max-w-2xl mt-4 mb-4"
          />
          {error && (
            <div className="mt-6 w-full">
              <ErrorMsg msg={error} />
            </div>
          )}
        </div>
      </div>

      {/* ファイルが選択されていない場合 */}
      {!audioUrl && (
        <div>
          <div className="container w-full mt-7 sm:mt-14">
            <div className="card h-48 bg-neutral text-neutral-content w-full container pt-5 pb-6">
              <p className="text font-bold">
                The selected audio file will appear here!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 再生 */}
      {audioUrl && (
        <div
          className={`
            transition-opacity duration-1000 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }
            container w-full mt-7 sm:mt-14 relative`}
        >
          {/* ローディング */}
          {loading && (
            <div
              className="card container h-full absolute"
              style={{ zIndex: 999 }}
            >
              <div
                className="w-full h-full flex items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
              >
                <progress
                  className="progress progress-accent w-60 h-4"
                  value={progress}
                  max="100"
                ></progress>
              </div>
            </div>
          )}

          {/* プレビュー */}
          <div className="card bg-neutral text-neutral-content w-full container pt-5 pb-6">
            <p className="text font-bold">
              You can now play or clip the audio file!
            </p>
            <div className="w-full mt-8">
              <MultiRangeSlider
                min={min}
                max={max}
                minValue={minValue}
                maxValue={maxValue}
                setMinValue={(v) => {
                  setMinValue(v);
                  setMinValueChanged(true);
                }}
                setMaxValue={setMaxValue}
                progressStart={startTime}
                progress={currentTime}
              />
            </div>
            <div className="flex justify-between w-full max-w-2xl text-sm mt-6">
              <span>{formatTime(minValue)}</span>
              <span>{formatTime(maxValue)}</span>
            </div>

            {/* オーディオプレイヤー */}
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              controls
              className="mt-4 hidden"
            >
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
            <div className="flex mt-2 flex-wrap gap-4 justify-center">
              <div className="flex space-x-4">
                <button
                  onClick={reset}
                  className="btn bg-blue-500 min-w-28 hover:bg-blue-400"
                >
                  <IoPlaySkipBack
                    style={{ color: "white", height: 24, width: 24 }}
                  />
                </button>

                {/* 再生ボタン */}
                {!isPlaying && (
                  <button
                    onClick={play}
                    className="btn bg-blue-500 min-w-28 hover:bg-blue-400"
                  >
                    <FaCirclePlay
                      style={{ color: "white", height: 24, width: 24 }}
                    />
                  </button>
                )}

                {/* 停止ボタン */}
                {isPlaying && (
                  <button
                    onClick={stop}
                    className="btn bg-blue-500 min-w-28 hover:bg-blue-400"
                  >
                    <FaGripLinesVertical
                      style={{ color: "white", height: 20, width: 28 }}
                    />
                  </button>
                )}
              </div>
              <button onClick={clipAudio} className="btn btn-accent">
                Clip and Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clipper;
