import sys
import cv2
import numpy as np

from ultralytics import YOLO
from PIL import Image

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
    # PILで画像を開き、NumPy配列に変換
    original_image = Image.open(image_path)
    image_np = np.array(original_image)

    # RGB → BGRに変換（色の問題解決）
    if image_np.shape[2] == 4:
        # RGBAの場合
        image_bgr = cv2.cvtColor(image_np[:, :, :3], cv2.COLOR_RGB2BGR)
        alpha_channel = image_np[:, :, 3]
    else:
        image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    # shape確認
    height, width = image_bgr.shape[:2]

    # マスクを作成（黒背景）
    mask = np.zeros((height, width), dtype=np.uint8)

    # 輪郭の領域を白に塗る
    contours = np.array(contours, np.int32)
    cv2.fillPoly(mask, [contours], 255)

    # マスクを適用して物体以外を黒くする
    cutout_bgr = cv2.bitwise_and(image_bgr, image_bgr, mask=mask)

    # RGBA対応の場合
    if image_np.shape[2] == 4:
        cutout_alpha = cv2.bitwise_and(alpha_channel, alpha_channel, mask=mask)
        cutout = cv2.merge((cutout_bgr, cutout_alpha))
    else:
        cutout = cutout_bgr

    # 切り抜いた画像を保存
    cv2.imwrite(output_path, cutout)
