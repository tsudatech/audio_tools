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

  return commonCodeIds
    .map((id) => {
      const codeListItem = codeList.find((c) => c.id === id);
      return codeListItem ? codeListItem.code : jsonData[id]?.code || "";
    })
    .filter((code) => code)
    .join("\n\n");
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
  // editorから最新のコードを取得
  const editorCode = code || strudelEditorRef.current.editor.code;

  // 再生対象がcommonCodeかどうかをチェック
  const isCommonCode =
    code &&
    Object.keys(commonCodes).some((id) => {
      const codeListItem = codeList.find((c) => c.id === id);
      return codeListItem && codeListItem.code === code;
    });

  let commonCodeText = "";
  let combinedCode = editorCode;

  // 再生対象がcommonCodeでない場合のみ共通コードを結合
  if (!isCommonCode) {
    commonCodeText = getCommonCodeText({ commonCodes, codeList, jsonData });
    combinedCode = commonCodeText
      ? `${commonCodeText}\n\n${editorCode}`
      : editorCode;
  }

  strudelEditorRef.current.editor.evaluate_with_p(combinedCode, isPlaying);
  if (shouldUpdateEditor && onEditorChange) {
    onEditorChange(editorCode);
  }
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

/**
 * コード再生シーケンス（DnD行順）を実行する
 * @param {Object} params - パラメータ
 * @param {Array} params.dndRow - DnD行のデータ
 * @param {Object} params.repeatCounts - 繰り返し回数のデータ
 * @param {string} params.selectedDnDRowId - 選択中のDnD行ID
 * @param {number} params.bpm - BPM
 * @param {number} params.hushBeforeMs - 停止前の待機時間（ミリ秒）
 * @param {Function} params.evaluateCommonCode - 共通コード評価関数
 * @param {Function} params.onProgress - 進行状況のコールバック
 * @param {Function} params.onComplete - 完了時のコールバック
 * @param {Function} params.onError - エラー時のコールバック
 * @param {Function} params.onCodeSelect - コード選択のコールバック
 * @returns {Promise} 再生完了のPromise
 */
export async function playSequence({
  dndRow,
  repeatCounts,
  selectedDnDRowId,
  bpm,
  hushBeforeMs,
  evaluateCommonCode,
  onProgress,
  onComplete,
  onError,
  onCodeSelect,
  strudelEditorRef,
}) {
  try {
    // DnD行の順で再生（DnD行の選択から）
    let startIdx = 0;
    if (selectedDnDRowId) {
      const idx = dndRow.findIndex((b) => b.rowId === selectedDnDRowId);
      if (idx !== -1) startIdx = idx;
    }

    for (let i = startIdx; i < dndRow.length; i++) {
      const { rowId, code } = dndRow[i];
      let repeat = parseInt(repeatCounts[rowId], 10);
      if (isNaN(repeat) || repeat <= 0) repeat = 8;
      let bpmVal = parseInt(bpm, 10);
      if (isNaN(bpmVal) || bpmVal <= 0) bpmVal = 120;

      // コードを評価してeditorに反映
      evaluateCommonCode(code, false);
      strudelEditorRef.current.editor.setCode(code);

      // 右側のコード一覧の選択を更新
      if (onCodeSelect) {
        onCodeSelect(dndRow[i].id, dndRow[i].code);
      }

      // 進行状況を通知
      if (onProgress) {
        onProgress(i, dndRow[i]);
      }

      // 1小節の長さ(秒) = 60 / BPM * 4 (4拍子)
      const barSec = (60 / bpmVal) * 4;
      const totalWait = barSec * repeat * 1000;

      await new Promise((resolve) => {
        // 終わる少し前にhush
        const hushTimer = setTimeout(() => {
          // 停止処理は外部で管理
          if (onProgress) {
            onProgress(i, dndRow[i], "hush");
          }
        }, totalWait - hushBeforeMs);

        // 指定小節数分待つ
        const mainTimer = setTimeout(() => {
          clearTimeout(hushTimer);
          resolve();
        }, totalWait);

        // timeout IDを保存（外部で管理）
        if (onProgress) {
          onProgress(i, dndRow[i], "timers", { hushTimer, mainTimer });
        }
      });
    }

    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    if (onError) {
      onError(error);
    }
  }
}

/**
 * 現在表示しているコードを再生する
 * @param {string} selectedCode - 選択中のコード
 * @param {Function} evaluateCommonCode - 共通コード評価関数
 * @param {Object} strudelEditorRef - Strudelエディタのref
 * @param {boolean} isSequencePlaying - シーケンスが再生中かどうか
 * @param {PlaybackManager} playbackManager - 再生マネージャーのインスタンス
 * @returns {Promise} 再生完了のPromise
 */
export async function playCurrentCode(
  selectedCode,
  evaluateCommonCode,
  strudelEditorRef,
  isSequencePlaying = false,
  playbackManager = null
) {
  if (!selectedCode || selectedCode.trim() === "") {
    throw new Error("再生するコードがありません");
  }

  // シーケンスが再生中の場合はPlaybackManagerのstopを呼び出し
  if (isSequencePlaying && playbackManager) {
    playbackManager.stop(null, strudelEditorRef);
  }

  try {
    evaluateCommonCode();
  } catch (error) {
    console.error("コードの実行に失敗しました:", error);
    throw new Error("コードの実行に失敗しました");
  }
}

/**
 * 再生状態を管理するクラス
 */
export class PlaybackManager {
  constructor() {
    this.isPlaying = false;
    this.playIndex = 0;
    this.stopFlag = false;
    this.timeouts = [];
  }

  /**
   * 再生を開始する
   * @param {Function} playSequenceFunc - シーケンス再生関数
   * @param {Object} params - 再生パラメータ
   * @param {Object} strudelEditorRef - Strudelエディタのref
   */
  async start(playSequenceFunc, params, strudelEditorRef) {
    // 再生中なら停止してから再開
    this.stop(null, strudelEditorRef);

    this.isPlaying = true;
    this.stopFlag = false;
    this.playIndex = 0;
    this.timeouts = [];

    try {
      setTimeout(async () => {
        await playSequenceFunc({
          ...params,
          onProgress: (index, row, action, data) => {
            this.playIndex = index;
            if (action === "timers" && data) {
              this.timeouts.push(data.hushTimer, data.mainTimer);
            }
            if (params.onProgress) {
              params.onProgress(index, row, action, data);
            }
          },
          onComplete: () => {
            this.isPlaying = false;
            this.playIndex = 0;
            this.timeouts = [];
            if (params.onComplete) {
              params.onComplete();
            }
          },
          onError: (error) => {
            this.isPlaying = false;
            this.playIndex = 0;
            this.timeouts = [];
            if (params.onError) {
              params.onError(error);
            }
          },
        });
      }, 100);
    } catch (error) {
      this.isPlaying = false;
      this.playIndex = 0;
      this.timeouts = [];
      throw error;
    }
  }

  /**
   * 再生を停止する
   * @param {Function} stopFunction - 停止関数
   * @param {Object} strudelEditorRef - Strudelエディタのref
   */
  stop(stopFunction, strudelEditorRef) {
    this.stopFlag = true;
    this.isPlaying = false;
    this.playIndex = 0;

    // すべてのtimeoutをクリア
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];

    // Strudelエディタの再生を停止
    if (strudelEditorRef?.current?.editor?.repl?.stop) {
      strudelEditorRef.current.editor.repl.stop();
    }

    if (stopFunction) {
      stopFunction();
    }
  }

  /**
   * 最初から再生する
   * @param {Function} startFunction - 開始関数
   * @param {boolean} shouldResetSelection - 選択をリセットするか
   */
  playFromStart(startFunction, shouldResetSelection = false) {
    if (shouldResetSelection) {
      // 選択リセット後に再生開始
      setTimeout(() => {
        startFunction();
      }, 100);
    } else {
      startFunction();
    }
  }
}
