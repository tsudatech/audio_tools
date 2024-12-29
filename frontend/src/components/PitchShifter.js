// App.js
import React, { useState } from "react";
import "../index.css";

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0から始まるため+1
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function PitchShifter() {
  const [text, setText] = useState(""); // テキスト入力の状態
  const [pitch, setPitch] = useState(undefined); // テキスト入力の状態
  const [audioUrl, setAudioUrl] = useState(null); // オーディオファイルの URL を格納
  const [fadeIn, setFadeIn] = useState(false); // オーディオファイルの URL を格納
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  function fetchWavFile(e) {
    setLoading(true);
    setAudioUrl(null);
    setFadeIn(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const val = prev + 100 / 10;
        return val > 90 ? 90 : val;
      });
    }, 1000);

    fetch("/serve-wav/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON データを送信
      },
      body: JSON.stringify({ text: text, pitch: pitch }), // テキストを JSON 形式で送信
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.blob();
      })
      .then((blob) => {
        const audioUrl = window.URL.createObjectURL(blob); // ブラウザで再生可能な URL を作成

        // State に URL を保存
        setAudioUrl(audioUrl);
        setTimeout(() => {
          setFadeIn(true); // 1秒後にコンポーネントを表示
        }, 100); // 少し遅延を加える（任意）
      })
      .catch((error) => {
        console.error("File download error:", error);
      })
      .finally(() => {
        setLoading(false);
        clearInterval(interval);
      });
  }

  const handleDownload = () => {
    if (!audioUrl) {
      return;
    }
    const link = document.createElement("a"); // <a>要素を作成
    link.href = audioUrl; // オーディオの URL を設定
    link.download = formatDateToYYYYMMDD(new Date()) + ".wav"; // ダウンロードファイル名を設定
    link.click(); // 自動的にクリックしてダウンロードを開始
    link.remove();
  };

  return (
    <div className="">
      {/* URL */}
      <div className="container w-full mt-7 sm:mt-14">
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
          <p className="text font-bold">Please paste YouTube URL or Video ID</p>
          <input
            type="text"
            placeholder="Paste URL or ID here"
            onChange={(e) => setText(e.target.value)}
            className="input input-bordered w-full max-w-2xl mt-4"
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

export default PitchShifter;
