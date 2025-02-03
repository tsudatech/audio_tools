import sys
import cv2
import numpy as np

# from ultralytics import YOLO

np.set_printoptions(threshold=sys.maxsize)


def get_contours(image_path):
    output_image = cv2.imread(image_path)
    # model = YOLO("yolov8n-seg.pt")  # YOLOv9 セグメンテーションモデル
    # results = model(image)
    # annotated_image = results[0].plot()
    # output_image = np.array(annotated_image)

    img = cv2.bitwise_not(output_image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gauss = cv2.GaussianBlur(gray, (5, 5), 0)
    thres = cv2.threshold(gauss, 140, 255, cv2.THRESH_BINARY)[1]

    # 輪郭のみを検出する
    cons = cv2.findContours(thres, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)[0]

    return cons
