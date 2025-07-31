import { EditorSelection } from "@codemirror/state";

// ランダムID生成（12桁英数字）
export function generateId(len = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// CodeMirrorエディタの最初のn行を削除する関数
export function deleteFirstNLines(view, n) {
  const doc = view.state.doc;
  const lastLine = doc.line(n); // n 行目（1-based）

  const transaction = view.state.update({
    changes: { from: 0, to: lastLine.to + 1 }, // +1 は改行も含める
    selection: EditorSelection.cursor(0),
    scrollIntoView: true,
  });

  view.dispatch(transaction);
}
