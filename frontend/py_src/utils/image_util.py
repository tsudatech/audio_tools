import sys
import cv2
import numpy as np
from ultralytics import YOLO

np.set_printoptions(threshold=sys.maxsize)


def apply_grabcut(image):
    mask = np.zeros(image.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    h, w = image.shape[:2]
    rect = (10, 10, w - 20, h - 20)  # オブジェクトを囲む矩形
    cv2.grabCut(image, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)

    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
    result = image * mask2[:, :, np.newaxis]  # 背景を除去
    return result


def apply_canny(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # 先にグレースケール化
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    return edges


def apply_morphology(edges):
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    morphed = cv2.erode(dilated, kernel, iterations=1)
    return morphed


def extract_contours(processed_image):
    contours, _ = cv2.findContours(
        processed_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    return contours


def get_contours(image_path):
    contours = []
    # 1. YOLOv9 モデルのロード (事前学習済み)
    model = YOLO("yolov8m-seg.pt")  # YOLOv9 セグメンテーションモデル

    # 2. 画像の読み込み
    # image = cv2.imread(image_path)
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)  # 1チャンネル → 3チャンネルへ変換
    image = cv2.blur(image, (9, 9))

    # 3. 物体検出
    results = model(image)  # YOLOv9 で推論実行

    # 4. 検出されたオブジェクトの処理
    for result in results:
        masks = result.masks  # セグメンテーションマスク取得
        if masks is None:
            continue  # セグメントがない場合スキップ

        for mask in masks.xy:
            # 5. 輪郭を OpenCV で検出
            contour = np.array(mask, dtype=np.int32)  # numpy 配列へ変換

            # マスク領域を元画像に適用
            mask_image = np.zeros((image.shape[0], image.shape[1], 3), dtype=np.uint8)
            cv2.fillPoly(mask_image, [contour], (255, 255, 255))

            # 1️⃣ GrabCut（背景除去）
            # grabcut_result = apply_grabcut(mask_image)

            # 2️⃣ Cannyエッジ検出（グレースケール変換）
            edges = apply_canny(mask_image)

            # 3️⃣ モルフォロジー処理
            morphed = apply_morphology(edges)

            # 4️⃣ 輪郭抽出
            refined_contours = extract_contours(morphed)
            return refined_contours

    return contours
