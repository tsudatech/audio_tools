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
