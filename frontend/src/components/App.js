// App.js
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月は0から始まるため+1
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function App() {
  const [text, setText] = useState(""); // テキスト入力の状態
  const [pitch, setPitch] = useState(undefined); // テキスト入力の状態
  const [audioUrl, setAudioUrl] = useState(null); // オーディオファイルの URL を格納
  const [fadeIn, setFadeIn] = useState(false); // オーディオファイルの URL を格納
  const [loading, setLoading] = useState(false);

  function fetchWavFile(e) {
    setLoading(true);
    setAudioUrl(null);
    setFadeIn(false);

    fetch("http://127.0.0.1:8000/serve-wav/", {
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
      .finally(() => setLoading(false));
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
      <div className="navbar bg-base-100">
        <div className="navbar-start">
          <div className="dropdown">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                <a href="/">Home</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="navbar-center">
          <a href="/" className="btn btn-ghost text-2xl">
            Youtube Pitch Shifter
          </a>
        </div>
        <div className="navbar-end"></div>
      </div>

      {/* URL */}
      <div className="container w-full mt-16">
        <div className="card bg-neutral text-neutral-content w-full container pt-4 pb-4">
          {/* ローディング */}
          {loading && (
            <div
              className="card w-full h-full flex justify-center items-center"
              style={{
                position: "absolute",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <span className="loading loading-spinner text-accent"></span>
            </div>
          )}

          {/* 本体 */}
          <p className="text font-bold">Please paste YouTube URL or Video ID</p>
          <input
            type="text"
            placeholder="Type here"
            onChange={(e) => setText(e.target.value)}
            className="input input-bordered w-full max-w-2xl mt-2"
          />
          <div className="mt-2 flex space-x-4">
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

      {/* 再生 */}
      {audioUrl && (
        <div
          className={`
            transition-opacity duration-1000 ${
              fadeIn ? "opacity-100" : "opacity-0"
            }
            container w-full mt-16`}
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

      {/* 説明文 */}
      <div className="container mt-16 justify-start items-center">
        <div class="max-w-2xl">
          <div>
            <h1 class="text text-2xl">Markdown Style Title</h1>
            <p className="mt-4">
              LoopTube is a free online tool to repeat any YouTube videos. Just
              select YouTube videos by typing a URL in the search bar, and you
              can set AB loop in any point of the video. This is useful when you
              want to learn some kind of skills (such as languages, sports,
              music, etc.) by watching a specific part over and over.
            </p>
          </div>
          <div class="mt-8">
            <h1 class="text text-2xl">Markdown Style Title</h1>
            <ul class="list-disc pl-5 text mt-4">
              <li>
                <strong>項目 1:</strong> これは最初のリストアイテムの説明です。
              </li>
              <li>
                <strong>項目 2:</strong> 次の項目は追加情報を含みます。
              </li>
              <li>
                <strong>項目 3:</strong> さらに多くのデータをここに記載します。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center bg-accent text-primary-content p-10 fixed bottom-0">
        <aside>
          <p className="font-bold">
            ACME Industries Ltd.
            <br />
            Providing reliable tech since 1992
          </p>
          <p>Copyright © {new Date().getFullYear()} - All right reserved</p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
              </svg>
            </a>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
              </svg>
            </a>
            <a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
              </svg>
            </a>
          </div>
        </nav>
      </footer>
    </div>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
