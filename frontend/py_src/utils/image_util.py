import sys
import cv2
import torch
import numpy as np
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2 import model_zoo

np.set_printoptions(threshold=sys.maxsize)

# 1. Detectron2の設定
cfg = get_cfg()
cfg.merge_from_file(
    model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml")
)
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5  # 信頼度の閾値
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
    "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
)
cfg.MODEL.DEVICE = (
    "cuda" if torch.cuda.is_available() else "cpu"
)  # GPUが利用可能なら使用

predictor = DefaultPredictor(cfg)


def get_contours(image_path):
    # 2. 画像の読み込み
    image = cv2.imread(image_path)

    # 3. オブジェクト検出とマスク生成
    outputs = predictor(image)
    instances = outputs["instances"]
    masks = instances.pred_masks.cpu().numpy()  # マスクを取得
    classes = instances.pred_classes.cpu().numpy()  # クラスID

    # 4. 境界線処理を適用
    for i, mask in enumerate(masks):
        binary_mask = mask.astype(np.uint8) * 255

        # (a) モルフォロジー処理でスムージング
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        smoothed_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)

        # (b) エッジ検出
        edges = cv2.Canny(smoothed_mask, 50, 150)

        # (c) GrabCutでさらに境界線を調整
        grabcut_mask = np.zeros_like(binary_mask, dtype=np.uint8)
        grabcut_mask[smoothed_mask > 0] = cv2.GC_PR_FGD
        grabcut_mask[smoothed_mask == 0] = cv2.GC_BGD

        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        cv2.grabCut(
            image, grabcut_mask, None, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_MASK
        )

        final_mask = np.where(
            (grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD), 255, 0
        ).astype(np.uint8)

        # (c) 境界線を取得
        contours, _ = cv2.findContours(
            final_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        return contours
