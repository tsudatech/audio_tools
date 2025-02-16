import React, { useState } from "react";
import ga from "../common/GAUtils";
import ContourDrawer from "./ContourDrawer";

const trackEvent = ga.trackEventBuilder("ImageClipper");

/**
 * 本体
 * @returns
 */
function Clipper() {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [contours, setContours] = useState(null);
  const [error, setError] = useState(null);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  /**
   * 輪郭を取得
   * @param {*} e
   */
  const getContours = (e) => {
    // FormDataを作成
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setFile(file);

    // imgSrcを取得
    const reader = new FileReader();
    reader.onload = (e) => {
      // 画像の横幅縦幅取得
      const img = new Image();
      img.onload = function () {
        // サイズ調整
        let width = img.width;
        let height = img.height;

        const maxSize = 700;
        let scaleX = 1;
        let scaleY = 1;
        if (width > height) {
          // 横長画像の場合
          scaleY = maxSize / width;
          scaleX = scaleY;
          height = height * scaleY;
          width = maxSize;
        } else {
          // 縦長画像の場合
          scaleX = maxSize / height;
          scaleY = scaleX;
          width = width * scaleX;
          height = maxSize;
        }

        img.width = width;
        img.height = height;
        setImage(img);
        setScaleX(scaleX);
        setScaleY(scaleY);

        // 輪郭抽出
        fetch("/api/get-image-contours/", {
          method: "POST",
          body: formData,
          responseType: "blob",
        })
          .then(async (response) => {
            // 取得後
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error);
            }
            return await response.json();
          })
          .then((json) => {
            // 取得後
            const contours = JSON.parse(json.contours);
            const largestArray = contours.reduce((max, current) => {
              return current.length > max.length ? current : max;
            }, []);

            // 画像サイズに合わせてスケール
            const scaledContours = [largestArray.flat()].map((contour) =>
              contour.map(([x, y]) => [x * scaleX, y * scaleY])
            );

            setContours(scaledContours);
          })
          .catch((error) => setError(error.message));
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  /**
   * 輪郭に沿って画像を切り取り
   */
  const clipImage = () => {
    // contoursスケール
    const scaledContours = contours.map((contour) =>
      contour.map(([x, y]) => [x / scaleX, y / scaleY])
    );

    // FormDataを作成
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contours", JSON.stringify(scaledContours));

    // 切り取り処理
    fetch("/api/clip-image/", {
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
        // ダウンロード
        const name = file.name.substring(0, file.name.lastIndexOf("."));
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name + "_clipped";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // メモリ解放
        URL.revokeObjectURL(url);
      })
      .catch((error) => {})
      .finally(() => {});
  };

  return (
    <div className="container w-full h-full justify-start">
      {/* ファイル選択 */}
      <div className="container w-full">
        <div className="card bg-neutral text-neutral-content w-full container pt-4 pb-4">
          {/* 本体 */}
          <p className="text font-bold">Please select image file</p>
          <input
            type="file"
            onChange={getContours}
            className="file-input file-input-bordered w-full max-w-2xl mt-4 mb-4"
          />
          {error && (
            <div className="mt-6 w-full">
              <ErrorMsg msg={error} />
            </div>
          )}
        </div>
      </div>

      <div className="container w-full h-full mt-8">
        <ContourDrawer
          image={image}
          contours={contours}
          setContours={setContours}
          clipImage={clipImage}
        />
      </div>
    </div>
  );
}

export default Clipper;
