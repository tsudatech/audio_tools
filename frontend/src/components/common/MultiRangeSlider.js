import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

const MultiRangeSlider = (props) => {
  const { min, max, minValue, maxValue, progress, progressStart } = props;

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxValue - 1); // maxValueを超えないよう制限
    props.setMinValue(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minValue + 1); // minValueを下回らないよう制限
    props.setMaxValue(value);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* スライダーコンテナ */}
      <Box
        className="relative w-full max-w-2xl"
        sx={{
          ".input-wrapper ::-webkit-slider-thumb": {
            "-webkit-appearance": "none",
            pointerEvents: "auto",
            zIndex: 50,
            height: "22px",
            width: "22px",
            backgroundColor: "#fff",
            borderRadius: "100px",
          },
          '.input-wrapper input[type="range"]': {
            pointerEvents: "none",
            zIndex: 50,
            "::webkit-slider-thumb": {
              height: "50px",
            },
          },
        }}
      >
        {/* 背景トラック */}
        <div className="absolute w-full h-3 bg-gray-300 rounded-full"></div>

        {/* 再生位置トラック */}
        {progress != undefined && (
          <div
            className="absolute h-3 bg-accent rounded-2xl z-40"
            style={{
              left: `${progressStart}% `,
              width: `${progress - progressStart}%`,
            }}
          ></div>
        )}

        {/* 選択範囲トラック */}
        <div
          className="absolute h-3 bg-blue-500 rounded-full"
          style={{
            left: `${(minValue / max) * 100}%`,
            right: `${100 - (maxValue / max) * 100}%`,
          }}
        ></div>

        <div className="input-wrapper w-full">
          {/* 左側スライダー */}
          <input
            type="range"
            min={min || 0}
            max={max || 100}
            value={minValue || 0}
            onChange={handleMinChange}
            className="absolute w-full h-3 appearance-none bg-transparent pointer-events-auto accent-blue-500"
          />

          {/* 右側スライダー */}
          <input
            type="range"
            min={min || 0}
            max={max || 100}
            value={maxValue || 100}
            onChange={handleMaxChange}
            className="absolute w-full h-3 appearance-none bg-transparent pointer-events-auto accent-blue-500"
          />
        </div>
      </Box>
    </div>
  );
};

export default MultiRangeSlider;
