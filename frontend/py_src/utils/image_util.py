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
    image = cv2.imread(image_path)
    model = YOLO("yolov8m-seg.pt")  # YOLOv9 セグメンテーションモデル
    results = model(image)

    for i, mask in enumerate(results[0].masks.xy if results[0].masks else []):
        contour = np.array(mask, dtype=np.int32)  # 形状を整える
        mask_img = np.zeros_like(image[:, :, 0])
        cv2.fillPoly(mask_img, [contour], 255)  # 輪郭部分を白に塗りつぶす

        # 元画像にマスクを適用
        masked_img = cv2.bitwise_and(image, image, mask=mask_img)
        img_hsv = cv2.cvtColor(masked_img, cv2.COLOR_BGR2HSV_FULL)
        gray = cv2.cvtColor(img_hsv, cv2.COLOR_BGR2GRAY)
        gauss = cv2.GaussianBlur(gray, (5, 5), 0)
        thres = cv2.threshold(gauss, 50, 255, cv2.THRESH_BINARY)[1]
        cons = cv2.findContours(thres, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]
        return cons

        # mask_np = mask.cpu().numpy().astype(np.uint8)
        # contours, _ = cv2.findContours(
        #     mask_np, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE
        # )

    return []

    # img = cv2.bitwise_not(image)
    # img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV_FULL)
    # gray = cv2.cvtColor(img_hsv, cv2.COLOR_BGR2GRAY)
    # gauss = cv2.GaussianBlur(gray, (5, 5), 0)
    # thres = cv2.threshold(gauss, 0, 255, cv2.THRESH_BINARY)[1]

    # # 輪郭のみを検出する
    # cons = cv2.findContours(thres, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]

    # return cons
