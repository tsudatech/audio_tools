import sys
import cv2
import numpy as np

from ultralytics import YOLO

np.set_printoptions(threshold=sys.maxsize)


def crop_largest_object(image_path):
    model = YOLO("yolov8n-seg.pt")  # YOLOv8 セグメンテーションモデル
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("画像が読み込めませんでした")

    results = model(image)
    max_area = 0
    best_bbox = None
    # img_height, img_width = image.shape[:2]

    for result in results:
        masks = result.masks
        if masks is None:
            continue

        for mask in masks.xy:
            contour = np.array(mask, dtype=np.int32)
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h  # バウンディングボックスの面積

            # 画像の外枠に接していないものを選択
            if (
                area
                > max_area
                # and x > 10
                # and y > 10
                # and (x + w) < (img_width - 10)
                # and (y + h) < (img_height - 10)
            ):
                max_area = area
                best_bbox = (x, y, w, h)

    if best_bbox is not None:
        x, y, w, h = best_bbox
        cropped_image = image[y : y + h, x : x + w]  # 物体を切り抜く
        return cropped_image, best_bbox

    return None  # 物体が見つからなかった場合


def get_contours(image_path):
    cropped_image, bbox = crop_largest_object(image_path)  # 領域を切り取り
    x_offset, y_offset = bbox  # バウンディングボックスの座標を取得

    # 前処理
    cropped_image = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2RGB)
    gray_image = cv2.cvtColor(cropped_image, cv2.COLOR_RGB2GRAY)
    edge_image = cv2.Canny(gray_image, 50, 70)

    # 輪郭のみを検出する
    cons = cv2.findContours(edge_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]

    # Contour の座標を元画像の座標系に変換
    adjusted_contours = []
    for contour in cons:
        adjusted_contour = contour + np.array(
            [x_offset, y_offset]
        )  # X, Y のオフセットを加算
        adjusted_contours.append(adjusted_contour)

    return adjusted_contours
