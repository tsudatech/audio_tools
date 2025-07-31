import { deleteFirstNLines } from "./utils";

/**
 * 共通コード管理機能を提供する関数
 * @param {Object} params - パラメータ
 * @param {Object} params.strudelEditorRef - Strudelエディタのref
 * @param {Object} params.commonCodes - 共通コードの状態
 * @param {Array} params.codeList - コードリスト
 * @param {Object} params.jsonData - JSONデータ
 * @param {Function} params.onCommonCodeChange - エディタ内容変更時のコールバック
 * @returns {Object} 共通コード管理機能
 */
function createCommonCodeManager({
  strudelEditorRef,
  commonCodes,
  codeList,
  jsonData,
  onCommonCodeChange,
}) {
  /**
   * 選択されている共通コードのテキストを取得する
   * @returns {string} 共通コードの結合テキスト（60行の改行＋コード本体）
   */
  function getCommonCodeText() {
    const commonCodeIds = Object.keys(commonCodes).filter(
      (id) => commonCodes[id]
    );
    if (commonCodeIds.length === 0) return "";

    return (
      "\n".repeat(60) +
      commonCodeIds
        .map((id) => {
          const codeListItem = codeList.find((c) => c.id === id);
          return codeListItem ? codeListItem.code : jsonData[id]?.code || "";
        })
        .filter((code) => code)
        .join("\n\n")
    );
  }

  /**
   * 指定した共通コード部分をエディタに挿入し、実行後にその行数分を削除する
   * @param {string} combinedCode - 共通コード＋本体コードの結合テキスト
   * @param {string} commonCodeText - 共通コード部分のテキスト
   */
  function deleteFirstNLinesWithDelay(combinedCode, commonCodeText) {
    if (!strudelEditorRef.current) return;

    // 非同期で実行
    setTimeout(() => {
      // 共通コードの行数をカウント
      const commonCodeLines = commonCodeText.split("\n");
      const commonCodeLinesCount = commonCodeLines.length;

      // スケジューラが開始されるまで監視
      const check = (intervalId) => {
        if (strudelEditorRef.current.editor.drawer?.scheduler) {
          // 共通コード＋1行分を削除
          deleteFirstNLines(
            strudelEditorRef.current.editor.editor,
            commonCodeLinesCount + 1
          );
          clearInterval(intervalId);
        }
      };

      // checkを実行
      const startedId = setInterval(() => check(startedId), 0);

      // スケジューラをリセット
      if (strudelEditorRef.current.editor.drawer?.scheduler) {
        strudelEditorRef.current.editor.drawer.scheduler = null;
      }

      // エディタに結合済みコードをセット
      strudelEditorRef.current.editor.setCode(combinedCode);
    }, 0);
  }

  /**
   * 共通コードと指定コードを結合して評価・実行する
   * @param {string|null} code - 評価するコード（nullならエディタの内容）
   * @param {boolean} shouldUpdateEditor - エディタ内容を更新するか
   */
  function evaluateCommonCode(code = null, shouldUpdateEditor = true) {
    // 共通コードと結合してevaluate
    const commonCodeText = getCommonCodeText();

    // editorから最新のコードを取得
    const editorCode = code || strudelEditorRef.current.editor.code;
    const combinedCode = commonCodeText
      ? `${commonCodeText}\n\n${editorCode}`
      : editorCode;

    strudelEditorRef.current.editor.evaluate_with_p(combinedCode);
    if (shouldUpdateEditor && onCommonCodeChange) {
      onCommonCodeChange(editorCode);
    }
    deleteFirstNLinesWithDelay(combinedCode, commonCodeText);
  }

  // 外部からアクセス可能な関数を返す
  return {
    getCommonCodeText,
    evaluateCommonCode,
  };
}

export default createCommonCodeManager;
