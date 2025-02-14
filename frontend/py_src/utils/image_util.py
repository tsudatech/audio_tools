import sys
import cv2
import numpy as np

from ultralytics import YOLO

np.set_printoptions(threshold=sys.maxsize)


def unsharp_masking(img, kx, ky, sigx, sigy, k):
    img_copy = img.astype("int16").copy()
    img_mean = cv2.GaussianBlur(img_copy, (kx, ky), sigx, sigy)
    diff_img = img_copy - img_mean
    img_k = diff_img * k
    result = img_copy + img_k
    return result


def get_contours(image_path):
    image = cv2.imread(image_path)
    im_th_tz = unsharp_masking(image, 3, 3, 2, 2, 3)
    model = YOLO("yolov8m-seg.pt")
    results = model(im_th_tz)

    contours = []
    for i, mask in enumerate(results[0].masks.xy if results[0].masks else []):
        contour = np.array(mask, dtype=np.int32)  # 形状を整える
        mask_img = np.zeros_like(image[:, :, 0])
        cv2.fillPoly(mask_img, [contour], 255)  # 輪郭部分を白に塗りつぶす

        # 元画像にマスクを適用
        masked_img = cv2.bitwise_and(image, image, mask=mask_img)
        gray = cv2.cvtColor(masked_img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
        cons = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)[0]
        contours.extend(cons)

    return contours


def image_clip(image_path, output_path, contours):
    # 画像を読み込む
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)

    if image is None:
        raise ValueError(f"画像 '{image_path}' を読み込めませんでした")

    # マスクを作成 (黒背景)
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    # 輪郭の領域を白に塗る
    contours = np.array(contours, np.int32)
    cv2.fillPoly(mask, contours, 255)

    # 画像をBGRA（透過チャンネル付き）に変換
    image_bgra = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)

    # アルファチャンネルを適用 (輪郭外を透明に)
    image_bgra[:, :, 3] = mask

    # 切り抜いた画像を保存
    cv2.imwrite(output_path, image_bgra)
