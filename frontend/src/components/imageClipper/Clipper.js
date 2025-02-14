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
  const [imageSrc, setImageSrc] = useState(null);
  const [contours, setContours] = useState(null);

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
    reader.onload = (e) => setImageSrc(e.target.result); // Data URL を保存
    reader.readAsDataURL(file);

    // 切り取り処理
    fetch("/api/get-image-contours/", {
      method: "POST",
      body: formData,
      responseType: "blob", // バイナリデータとしてレスポンスを受け取る
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
        const json = await response.json();
        return json;
      })
      .then((json) => {
        const contours = JSON.parse(json.contours);
        const largestArray = contours.reduce((max, current) => {
          return current.length > max.length ? current : max;
        }, []);
        setContours([largestArray.flat()]);
      })
      .catch((error) => {})
      .finally(() => {});
  };

  /**
   * 輪郭に沿って画像を切り取り
   */
  const clipImage = () => {
    // FormDataを作成
    const formData = new FormData();
    formData.append("file", file);
    formData.append("contours", JSON.stringify(contours));

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
    <div className="contianer w-full h-full">
      <input
        type="file"
        onChange={getContours}
        className="file-input file-input-bordered w-full max-w-2xl mt-4 mb-4"
      />
      <div className="btn" onClick={clipImage}>
        clip image
      </div>
      <ContourDrawer
        imageSrc={imageSrc}
        contours={contours}
        setContours={setContours}
      />
    </div>
  );
}

export default Clipper;
