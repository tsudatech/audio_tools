// App.js
import React, { useState } from "react";
import ErrorMsg from "../common/ErrorMsg";
import ga from "../common/GAUtils";

const trackEvent = ga.trackEventBuilder("Shifter");

function Clipper() {
  const [file, setFile] = useState(null);
  const [pitch, setPitch] = useState(undefined);
  const [audioUrl, setAudioUrl] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  function fetchWavFile(e) {
    trackEvent({ action: "fetchWavFile" });
    setLoading(true);
    setAudioUrl(null);
    setFadeIn(false);
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
    formData.append("pitch", pitch);

    // ピッチ変更処理
    fetch("/api/serve-wav/", {
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

        // State に URL を保存
        setAudioUrl(audioUrl);
        setTimeout(() => {
          setFadeIn(true);
        }, 100);
      })
      .catch((error) => setError(error.message))
      .finally(() => {
        setLoading(false);
        clearInterval(interval);
      });
  }

  const handleDownload = () => {
    trackEvent({ action: "fetchWavFile" });

    if (!audioUrl || !file) {
      return;
    }
    const name = file.name.substring(0, file.name.lastIndexOf("."));
    const link = document.createElement("a"); // <a>要素を作成
    link.href = audioUrl; // オーディオの URL を設定
    link.download = name + (pitch < 0 ? "m" : "") + pitch; // ダウンロードファイル名を設定
    link.click(); // 自動的にクリックしてダウンロードを開始
    link.remove();
  };

  return (
    <div className="">
      {/* ファイル選択 */}
      <div className="container w-full">
        <div className="card bg-neutral text-neutral-content w-full container pt-4 pb-4">
          {/* ローディング */}
          {loading && (
            <div
              className="card w-full h-full flex justify-center items-center"
              style={{
                position: "absolute",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 999,
              }}
            >
              <progress
                className="progress progress-accent w-60 h-4"
                value={progress}
                max="100"
              ></progress>
            </div>
          )}

          {/* 本体 */}
          <p className="text font-bold">Please select audio file</p>
          <input
            type="file"
            onChange={(e) => {
              const target = e.target.files[0];
              if (!target) {
                return;
              }
              setFile(target);
            }}
            className="file-input file-input-bordered w-full max-w-2xl mt-4"
          />
          <div className="mt-4 flex space-x-4">
            <select
              onChange={(e) => setPitch(e.target.value)}
              className="select select-accent w-full max-w-xs"
            >
              <option disabled selected>
                Select pitch...
              </option>
              <option>-6</option>
              <option>-5</option>
              <option>-4</option>
              <option>-3</option>
              <option>-2</option>
              <option>-1</option>
              <option>0</option>
              <option>+1</option>
              <option>+2</option>
              <option>+3</option>
              <option>+4</option>
              <option>+5</option>
              <option>+6</option>
            </select>
            <button onClick={fetchWavFile} className="btn btn-accent">
              Start Shift
            </button>
          </div>
          {error && (
            <div className="mt-6 w-full">
              <ErrorMsg msg={error} />
            </div>
          )}
        </div>
      </div>

      {!audioUrl && (
        <div>
          <div className="container w-full mt-7 sm:mt-14">
            <div className="card h-48 bg-neutral text-neutral-content w-full container pt-4 pb-4">
              <p className="text font-bold">
                Pitch-shifted audio will appear hear!
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
            container w-full mt-7 sm:mt-14`}
        >
          <div className="card bg-neutral text-neutral-content w-full container pt-4 pb-4">
            <p className="text font-bold">
              You can now play a pitch-shifted file!
            </p>
            <audio
              className="mt-4"
              controls
              src={audioUrl}
              style={{ width: "100%" }}
            >
              The audio element is not supported by your browser.
            </audio>
            <button onClick={handleDownload} className="btn btn-accent mt-4">
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clipper;
