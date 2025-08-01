import { StateField, StateEffect } from "@codemirror/state";

// 状態を更新するためのEffect（操作）
const setCommonCodeCharCount = StateEffect.define();

// 独自の状態フィールドを定義
const commonCodeCharCountField = StateField.define({
  create() {
    return 0; // 初期値
  },
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setCommonCodeCharCount)) return effect.value;
    }
    return value;
  },
});

export { commonCodeCharCountField, setCommonCodeCharCount };
