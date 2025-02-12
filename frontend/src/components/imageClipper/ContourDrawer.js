import React, { useEffect, useRef, useState } from "react";
import ga from "../common/GAUtils";
import cloneDeep from "lodash.clonedeep";

const trackEvent = ga.trackEventBuilder("ImageClipper");

/**
 * AB, CDが交差しているかどうか判定
 */
function isCrossing(A, B, C, D) {
  // 外積を計算する関数
  const crossProduct = (p1, p2, p3) => {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  };

  // 線分ABとCDが交差しているか判定
  const d1 = crossProduct(A, B, C); // CがABのどちら側にあるか
  const d2 = crossProduct(A, B, D); // DがABのどちら側にあるか
  const d3 = crossProduct(C, D, A); // AがCDのどちら側にあるか
  const d4 = crossProduct(C, D, B); // BがCDのどちら側にあるか

  // 条件1: ABの両端がCDの異なる側にある
  const condition1 = d1 * d2 < 0;
  // 条件2: CDの両端がABの異なる側にある
  const condition2 = d3 * d4 < 0;

  return condition1 && condition2;
}

/**
 * contourの中で(a, b)に最も近い点を発見
 * @param {*} contour
 * @param {*} a
 * @param {*} b
 * @returns
 */
function findClosestIndex(contour, a, b) {
  let minDistance = Infinity;
  let closestIndex = -1;
  for (let i = 0; i < contour.length; i++) {
    const [x, y] = contour[i];
    const distance = Math.sqrt((a - x) ** 2 + (b - y) ** 2);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }
  return closestIndex;
}

/**
 * pointsの合計距離を算出
 * @param {*} points
 * @returns
 */
function calculateTotalDistance(points) {
  if (points.length < 2) {
    // 点が1つ以下の場合は計算不能
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    // 距離を計算 (ユークリッド距離)
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    totalDistance += distance;
  }
  return totalDistance;
}

/**
 * pointsの距離的にX等分された場合の最初の点を見つける
 * @param {*} points
 * @returns
 */
function findXthPoints(points, x) {
  if (points.length < 2) {
    // 点が1つ以下の場合は計算不能
    return null;
  }

  const totalDistance = calculateTotalDistance(points) / x;
  const tempPoints = [points[0]];
  for (let point of points) {
    tempPoints.push(point);
    const tempDist = calculateTotalDistance(tempPoints);
    if (tempDist > totalDistance) {
      return point;
    }
  }
  return points[points.length - 1];
}

/**
 * 本体
 * @returns
 */
function ContourDrawer(props) {
  const canvasRef = useRef(null);
  const { imageSrc, onContoursUpdated, contours, setContours } = props;
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);
  const [dragging, setDragging] = useState({ active: false });
  const pointStack = useRef([]);
  const closestIndex = useRef({ index: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 画像と境界線を描画
    const draw = () => {
      if (!imageSrc) {
        return;
      }

      // 画像の読み込み
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        // キャンバスサイズ設定
        canvas.width = image.width;
        canvas.height = image.height;
        setWidth(image.width);
        setHeight(image.height);

        // 画像描画
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        // 境界線描画
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        contours.forEach((contour) => {
          ctx.beginPath();
          contour.forEach(([x, y]) => ctx.lineTo(x, y));
          ctx.closePath();
          ctx.stroke();
        });

        // 描画中の線
        ctx.beginPath();
        pointStack.current.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.stroke();
      };
    };

    draw();
  }, [imageSrc, contours, pointStack.current]);

  /**
   * マウス押下時
   * @param {*} e
   */
  const handleMouseDown = (e) => {
    setDragging({ active: true });
    closestIndex.current = { index: null };
    pointStack.current = [];
  };

  /**
   * マウスドラッグ時
   * @param {*} e
   * @returns
   */
  const handleMouseMove = (e) => {
    if (!dragging.active) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newContours = [...contours];
    for (
      let contourIndex = 0;
      contourIndex < newContours.length;
      contourIndex++
    ) {
      const contour = newContours[contourIndex];
      if (closestIndex.current.index == null) {
        const _closestIndex = findClosestIndex(contour, mouseX, mouseY);
        closestIndex.current = { index: _closestIndex };
      } else {
        const stack = cloneDeep(pointStack.current);
        stack.push([mouseX, mouseY]);
        pointStack.current = stack;
      }

      setContours(newContours);
    }
  };

  /**
   * マウスクリック終了時
   */
  const handleMouseUp = () => {
    setDragging({ active: false });
    const newContours = [...contours];
    for (
      let contourIndex = 0;
      contourIndex < newContours.length;
      contourIndex++
    ) {
      const contour = newContours[contourIndex];
      const lastPoint = pointStack.current[pointStack.current.length - 1];
      const _closestIndex = findClosestIndex(
        contour,
        lastPoint[0],
        lastPoint[1]
      );

      // 点がクロスしているかどうかをチェック
      const startIdx = closestIndex.current.index;
      const endIdx = _closestIndex;
      let [minIdx, maxIdx] =
        startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      const startToMin = contour.slice(0, minIdx);
      const maxToEnd = contour.slice(maxIdx, contour.length);
      const minToMax = contour.slice(minIdx, maxIdx);
      const distA = calculateTotalDistance(startToMin);
      const distB = calculateTotalDistance(maxToEnd);
      const distC = calculateTotalDistance(minToMax);
      if (distA + distB < distC) {
        contour.splice(0, minIdx);
        contour.splice(maxIdx - minIdx, contour.length);
        minIdx = contour.length - 1;
        maxIdx = 0;
      }

      // 線が交差していないか調査
      const stack = pointStack.current;
      const a = contour[minIdx];
      const b = stack[0];
      const c = contour[maxIdx];
      const d = stack[stack.length - 1];
      const e = findXthPoints(stack, 3);
      const f = findXthPoints(stack, 1.5);
      if (
        isCrossing(a, b, c, d) ||
        isCrossing(a, e, c, d) ||
        isCrossing(a, f, c, d) ||
        isCrossing(a, b, c, e) ||
        isCrossing(a, b, c, f)
      ) {
        stack.reverse();
      }

      // 点を挿入
      contour.splice(minIdx + 1, maxIdx - minIdx, ...stack);
      closestIndex.current = { index: null };
      pointStack.current = [];
      setContours(newContours);
    }

    if (onContoursUpdated) {
      onContoursUpdated(contours); // 更新された境界線を親コンポーネントに送信
    }
  };

  return (
    <div className="contianer w-full h-full">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: "1px solid black",
          cursor: "pointer",
          height: height,
          width: width,
        }}
      />
    </div>
  );
}

export default ContourDrawer;
