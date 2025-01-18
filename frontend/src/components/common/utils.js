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
