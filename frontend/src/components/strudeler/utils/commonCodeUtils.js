import { deleteFirstNLines } from "./utils.js";

/**
 * 選択されている共通コードのテキストを取得する
 * @param {Object} params - パラメータ
 * @param {Object} params.commonCodes - 共通コードの状態
 * @param {Array} params.codeList - コードリスト
 * @param {Object} params.jsonData - JSONデータ
 * @returns {string} 共通コードの結合テキスト（60行の改行＋コード本体）
 */
export function getCommonCodeText({ commonCodes, codeList, jsonData }) {
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
 * @param {Object} params - パラメータ
 * @param {Object} params.strudelEditorRef - Strudelエディタのref
 * @param {string} params.combinedCode - 共通コード＋本体コードの結合テキスト
 * @param {string} params.commonCodeText - 共通コード部分のテキスト
 */
export function deleteFirstNLinesWithDelay({
  strudelEditorRef,
  combinedCode,
  commonCodeText,
}) {
  if (!strudelEditorRef.current) return;

  // 非同期で実行
  setTimeout(() => {
    // 共通コードの行数をカウント
    const commonCodeLines = commonCodeText.split("\n");
    const commonCodeLinesCount = commonCodeLines.length;

    // 現在のカーソル位置とスクロール位置を保存
    const currentLocation = strudelEditorRef.current.editor.getCursorLocation();
    const currentScrollTop =
      strudelEditorRef.current.editor.editor.scrollDOM.scrollTop;

    // スケジューラが開始されるまで監視
    const check = (intervalId) => {
      if (strudelEditorRef.current.editor.drawer?.scheduler) {
        // 共通コード＋1行分を削除
        deleteFirstNLines(
          strudelEditorRef.current.editor.editor,
          commonCodeLinesCount + 1
        );
        clearInterval(intervalId);

        // カーソル位置とスクロール位置を復元
        strudelEditorRef.current.editor.setCursorLocation(currentLocation);
        setTimeout(() => {
          strudelEditorRef.current.editor.editor.scrollDOM.scrollTop =
            currentScrollTop;
        }, 0);
      }
    };

    // checkを実行
    const startedId = setInterval(() => check(startedId), 0);

    // スケジューラをリセット
    if (strudelEditorRef.current.editor.drawer?.scheduler) {
      strudelEditorRef.current.editor.drawer.scheduler = null;
    }

    // エディタに結合済みコードをセット
    strudelEditorRef.current.setAttribute("code", combinedCode);
  }, 0);
}

/**
 * 共通コードと指定コードを結合して評価・実行する
 * @param {Object} params - パラメータ
 * @param {Object} params.strudelEditorRef - Strudelエディタのref
 * @param {Object} params.commonCodes - 共通コードの状態
 * @param {Array} params.codeList - コードリスト
 * @param {Object} params.jsonData - JSONデータ
 * @param {string|null} params.code - 評価するコード（nullならエディタの内容）
 * @param {boolean} params.shouldUpdateEditor - エディタ内容を更新するか
 * @param {Function} params.onEditorChange - エディタ内容変更時のコールバック
 */
export function evaluateCommonCode({
  strudelEditorRef,
  commonCodes,
  codeList,
  jsonData,
  code = null,
  shouldUpdateEditor = true,
  onEditorChange,
  isPlaying = false,
}) {
  // 共通コードと結合してevaluate
  const commonCodeText = getCommonCodeText({ commonCodes, codeList, jsonData });

  // editorから最新のコードを取得
  const editorCode = code || strudelEditorRef.current.editor.code;
  const combinedCode = commonCodeText
    ? `${commonCodeText}\n\n${editorCode}`
    : editorCode;

  strudelEditorRef.current.editor.evaluate_with_p(combinedCode, isPlaying);
  if (shouldUpdateEditor && onEditorChange) {
    onEditorChange(editorCode);
  }
  deleteFirstNLinesWithDelay({
    strudelEditorRef,
    combinedCode,
    commonCodeText,
  });
}

/**
 * 共通コード管理機能を提供する関数
 * @param {Object} params - パラメータ
 * @param {Object} params.strudelEditorRef - Strudelエディタのref
 * @param {Object} params.commonCodes - 共通コードの状態
 * @param {Array} params.codeList - コードリスト
 * @param {Object} params.jsonData - JSONデータ
 * @param {Function} params.onEditorChange - エディタ内容変更時のコールバック
 * @returns {Object} 共通コード管理機能
 */
export function createCommonCodeManager({
  strudelEditorRef,
  commonCodes,
  codeList,
  jsonData,
  onEditorChange,
}) {
  return {
    getCommonCodeText: () =>
      getCommonCodeText({ commonCodes, codeList, jsonData }),
    evaluateCommonCode: (
      code = null,
      shouldUpdateEditor = true,
      isPlaying = false
    ) =>
      evaluateCommonCode({
        strudelEditorRef,
        commonCodes,
        codeList,
        jsonData,
        code,
        shouldUpdateEditor,
        onEditorChange,
        isPlaying,
      }),
  };
}
