import React, { useState } from "react";
import { Box } from "@mui/material";

const MultiRangeSlider = () => {
  const [minValue, setMinValue] = useState(20); // 左端の値
  const [maxValue, setMaxValue] = useState(80); // 右端の値
  const min = 0; // スライダーの最小値
  const max = 100; // スライダーの最大値

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxValue - 1); // maxValueを超えないよう制限
    setMinValue(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minValue + 1); // minValueを下回らないよう制限
    setMaxValue(value);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* スライダーコンテナ */}
      <Box
        className="relative w-full max-w-xl"
        sx={{
          ".input-wrapper ::-webkit-slider-thumb": {
            pointerEvents: "auto",
          },
          '.input-wrapper input[type="range"]': {
            pointerEvents: "none",
          },
        }}
      >
        {/* 背景トラック */}
        <div className="absolute w-full h-2 bg-gray-300 rounded-full"></div>

        {/* 選択範囲トラック */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{
            left: `${(minValue / max) * 100}%`,
            right: `${100 - (maxValue / max) * 100}%`,
          }}
        ></div>

        <div className="input-wrapper w-full">
          {/* 左側スライダー */}
          <input
            type="range"
            min={min}
            max={max}
            value={minValue}
            onChange={handleMinChange}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto accent-blue-500"
          />

          {/* 右側スライダー */}
          <input
            type="range"
            min={min}
            max={max}
            value={maxValue}
            onChange={handleMaxChange}
            className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto accent-blue-500"
          />
        </div>
      </Box>

      {/* 選択された範囲を表示 */}
      <div className="flex justify-between w-full max-w-xl text-sm">
        <span>Min: {minValue}</span>
        <span>Max: {maxValue}</span>
      </div>
    </div>
  );
};

export default MultiRangeSlider;
