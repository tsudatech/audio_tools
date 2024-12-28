// App.js
import React from "react";

function Description() {
  return (
    <div className="container mt-16 justify-start items-center">
      <div class="max-w-2xl">
        <div>
          <h1 class="text text-2xl">Markdown Style Title</h1>
          <p className="mt-4">
            LoopTube is a free online tool to repeat any YouTube videos. Just
            select YouTube videos by typing a URL in the search bar, and you can
            set AB loop in any point of the video. This is useful when you want
            to learn some kind of skills (such as languages, sports, music,
            etc.) by watching a specific part over and over.
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
  );
}

export default Description;
