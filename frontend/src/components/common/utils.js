import { useMediaQuery } from "react-responsive";
import { theme } from "../../../tailwind.config"; // Your Tailwind config

const breakpoints = theme.screens;

export function useBreakpoint(breakpointKey) {
  // useMediaQueryを使用してブレークポイントを判定
  const bool = useMediaQuery({
    query: `(min-width: ${breakpoints[breakpointKey]})`,
  });

  // ブレークポイント名をキャピタライズ
  const capitalizedKey =
    breakpointKey[0].toUpperCase() + breakpointKey.substring(1);

  // 動的にオブジェクトキーを作成して返す
  return {
    [`is${capitalizedKey}`]: bool,
  };
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60); // 分を計算
  const secs = seconds % 60; // 残りの秒数を計算
  return `${minutes}:${secs.toString().padStart(2, "0")}`; // 秒を2桁にする
}
