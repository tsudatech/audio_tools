import React, { useRef, useState, useEffect } from "react";
import "./strudel/repl/repl-component.mjs";
import { StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { keymap } from "@codemirror/view";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";
import { arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { initAudioOnFirstClick } from "@strudel/webaudio";
import { setCommonCodeCharCount } from "./strudel/codemirror/commonCodeCharCount.mjs";
import TopControlBar from "./TopControlBar";
import EditorControls from "./EditorControls";
import CodeOrderManager from "./CodeOrderManager";
import CodeListDnD from "./CodeListDnD";
import CodeListButtons from "./CodeListButtons";
import ErrorDisplay from "./ErrorDisplay";

// Utils
import {
  exportJson,
  exportCodesRowOrder,
  importCodesRowOrder,
  exportAllState,
  importAllState,
  saveJsonDataToIndexedDB,
  loadJsonDataFromIndexedDB,
} from "./utils/exportImportUtils";
import {
  loadJsonFile,
  updateCodeFromEditor,
  deleteSelectedCode,
  duplicateSelectedCode,
  createNewCode,
} from "./utils/codeListEditorUtils";
import {
  removeFromRow,
  updateRepeatCount,
  addAllToRow,
  addBlockToCodeOrder,
  deleteAllCodes,
  codeOrderDragEnd,
} from "./utils/codeOrderUtils";
import {
  createKeyboardShortcutHandler,
  setupKeyboardShortcuts,
} from "./utils/keyboardShortcutsUtils";
import { Compartment } from "@codemirror/state";
import { getCommonCodeText, getCodeListFromJsonData } from "./utils/utils";
import {
  highlightMiniLocations,
  updateMiniLocations,
} from "./strudel/codemirror/highlight.mjs";

/**
 * Compartment for updating the editor's update listener.
 */
const updateListenerCompartment = new Compartment();

/**
 * Creates an update listener for the editor.
 *
 * @param {React.RefObject} ref - The ref to the editor.
 * @param {boolean} isPlaying - Whether the editor is playing.
 * @param {function} evaluate - The evaluate function.
 * @returns {EditorView.updateListener} The update listener.
 */
const createUpdateListener = (ref, isPlaying, evaluate) => {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged && isPlaying) {
      setTimeout(() => {
        evaluate(ref.current.editor.editor.state.doc.toString(), false, false);
      }, 1000);
    }
  });
};

function Strudeler() {
  // Data State
  const [jsonData, setJsonData] = useState({});
  const [commonCodes, setCommonCodes] = useState({});

  // Editor State
  const [selectedCodeId, setSelectedCodeId] = useState(null);

  // Playback State
  const [bpm, setBpm] = useState(172);
  const [hushBeforeMs, setHushBeforeMs] = useState(150);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFlash, setShowFlash] = useState(() => {
    const savedFlash = localStorage.getItem("strudeler-flash");
    return savedFlash !== null ? JSON.parse(savedFlash) : true;
  });
  const [shouldHighlight, setShouldHighlight] = useState(() => {
    const savedHighlight = localStorage.getItem("strudeler-highlight");
    return savedHighlight !== null ? JSON.parse(savedHighlight) : true;
  });

  // Code Order State
  const [codeOrder, setCodeOrder] = useState([]);
  const [repeatCounts, setRepeatCounts] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [selectedCodeOrderId, setSelectedCodeOrderId] = useState(null);
  const [playbackEndTime, setPlaybackEndTime] = useState(null);
  const [currentPlayingCodeOrderId, setCurrentPlayingCodeOrderId] =
    useState(null);

  // Error State
  const [evaluateError, setEvaluateError] = useState(null);

  // Misc State
  const playFromStartFlag = useRef(false);
  const currentTimeoutsRef = useRef(new Map()); // codeOrderIdごとのtimeout管理

  // Resizer State
  const [editorWidth, setEditorWidth] = useState(() => {
    const saved = localStorage.getItem("strudeler-editor-width");
    return saved ? parseInt(saved) : 66.67; // デフォルト 2/3 = 66.67%
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef(null);

  // ファイル選択用ref
  const jsonFileInputRef = useRef(null);
  const importCodesRowInputRef = useRef(null);
  const importAllStateInputRef = useRef(null);
  const strudelEditorRef = useRef(null);
  const topControlBarRef = useRef(null);

  // =================================================================
  // エディタのevaluateを上書き
  // =================================================================
  const evaluate = async (
    code,
    shouldFlash = null,
    shouldUpdateEditor = true,
    codeId = null
  ) => {
    setIsPlaying(true);
    setEvaluateError(null); // エラーをリセット

    // flashが有効な場合のみflashを実行
    if (showFlash && shouldFlash !== false) {
      strudelEditorRef.current.editor.flash();
    }

    // 再生対象がcommonCodeかどうかをチェック
    const editorCode =
      code || strudelEditorRef.current.editor.editor.state.doc.toString();
    const isCommonCode =
      editorCode &&
      Object.keys(commonCodes).some((id) => id === (codeId || selectedCodeId));

    let commonCodeText = "";
    let combinedCode = editorCode;

    // 再生対象がcommonCodeでない場合のみ共通コードを結合
    if (!isCommonCode) {
      commonCodeText = getCommonCodeText({ commonCodes, jsonData });
      combinedCode = commonCodeText
        ? `${commonCodeText}\n\n${editorCode}`
        : editorCode;
    }

    strudelEditorRef.current.editor.repl.evaluate(combinedCode);
    if (shouldUpdateEditor) {
      handleEditorChange(editorCode);
    }
  };

  // =================================================================
  // useEffect
  // =================================================================

  // 初期表示時にIndexedDBから全状態をロード
  useEffect(() => {
    loadJsonDataFromIndexedDB((loaded) => {
      if (loaded && typeof loaded === "object") {
        // 各状態を復元
        if (loaded.jsonData) setJsonData(loaded.jsonData);
        if (loaded.codeOrder) setCodeOrder(loaded.codeOrder);
        if (loaded.repeatCounts) setRepeatCounts(loaded.repeatCounts);
        if (loaded.commonCodes) setCommonCodes(loaded.commonCodes);
        if (loaded.bpm) setBpm(loaded.bpm);
        if (loaded.hushBeforeMs) setHushBeforeMs(loaded.hushBeforeMs);

        // 選択状態をリセットし、最初のコードをeditorに表示
        const codeList = getCodeListFromJsonData(loaded.jsonData || {});
        const firstId = codeList[0]?.id || null;
        setSelectedCodeId(firstId);
        if (codeList[0] && strudelEditorRef.current) {
          strudelEditorRef.current.editor.setCode(codeList[0].code);
        }
        setSelectedCodeOrderId(null);
      }
    });
  }, []);

  // 全状態が変更されるたびにIndexedDBへ自動保存
  useEffect(() => {
    if (jsonData && typeof jsonData === "object") {
      // codeOrderからcodeを除外したバージョンを作成
      const codeOrderForExport = codeOrder.map(({ id, codeOrderId }) => ({
        id,
        codeOrderId,
      }));
      const state = {
        jsonData,
        codeOrder: codeOrderForExport,
        repeatCounts,
        commonCodes,
        bpm,
        hushBeforeMs,
      };
      saveJsonDataToIndexedDB(state);
    }
  }, [jsonData, codeOrder, repeatCounts, commonCodes, bpm, hushBeforeMs]);

  // evaluateを上書き
  useEffect(() => {
    // editor上でctrl + enter押した際にevaluateが実行されるため、毎回上書きする
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.evaluate = evaluate;
    }
  }, [strudelEditorRef, showFlash, selectedCodeId, commonCodes, jsonData]);

  // superdoughの初期化
  useEffect(() => {
    initAudioOnFirstClick();
  }, []);

  // consoleログの監視 ([eval] error:)
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      // 元のconsole.logを呼び出し
      originalConsoleLog.apply(console, args);

      // [eval] error: を含むメッセージを検知
      const message = JSON.stringify(args);
      if (message.includes("[eval] error:")) {
        const match = message.match(/\[eval\] error:.*?\(\d+:\d+\)/);
        const errorText = match ? match[0].replace("[eval] e", "E") : "";
        setEvaluateError({
          message: errorText || "コードの実行中にエラーが発生しました",
        });
      }
    };

    // クリーンアップ関数
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // 共通コードの文字数を取得してエディタのstateに反映 (highlight.mjsで使用)
  useEffect(() => {
    // common codeの文字数を取得
    const commonCodeText = getCommonCodeText({
      commonCodes,
      jsonData,
    });

    const commonCodeCharCount = commonCodeText.length;
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.editor.dispatch({
        effects: setCommonCodeCharCount.of(commonCodeCharCount + 2),
      });
    }
  }, [commonCodes]);

  // エディタの設定
  useEffect(() => {
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.setFontFamily("monospace");

      // VSCode keymapを追加
      if (strudelEditorRef.current.editor.editor) {
        strudelEditorRef.current.editor.editor.dispatch({
          effects: StateEffect.appendConfig.of([keymap.of(vscodeKeymap)]),
        });
      }

      // エディタの高さを設定
      strudelEditorRef.current.editor.editor.scrollDOM.style.height =
        "calc(100vh - 240px)";

      // highlight更新用のコンパートメントを追加
      if (strudelEditorRef?.current?.editor?.editor) {
        strudelEditorRef.current.editor.editor.dispatch({
          effects: StateEffect.appendConfig.of([
            updateListenerCompartment.of(createUpdateListener("")),
          ]),
        });
      }

      // highlightを表示するかどうかを設定
      strudelEditorRef.current.editor.highlight = (haps, time) => {
        if (shouldHighlight) {
          updateMiniLocations(strudelEditorRef.current.editor.editor, []);
          highlightMiniLocations(
            strudelEditorRef.current.editor.editor,
            time,
            haps
          );
        }
      };
    }
  }, [strudelEditorRef]);

  useEffect(() => {
    strudelEditorRef.current.editor.highlight = (haps, time) => {
      if (shouldHighlight) {
        highlightMiniLocations(
          strudelEditorRef.current.editor.editor,
          time,
          haps
        );
      } else {
        updateMiniLocations(strudelEditorRef.current.editor.editor, []);
      }
    };
  }, [shouldHighlight]);

  // selectedCodeOrderIdの変更を監視して最初から再生を制御
  useEffect(() => {
    if (playFromStartFlag.current && selectedCodeOrderId === null) {
      playFromStartFlag.current = false;
      handlePlay();
    }
  }, [selectedCodeOrderId]);

  // スクロールイベントの監視
  useEffect(() => {
    const handleScroll = () => {
      const appElement = document.getElementById("app");
      const scrollY = appElement ? appElement.scrollTop : window.scrollY;

      // TopControlBarの位置を動的に調整
      if (topControlBarRef.current) {
        const baseTop = 56;
        const newTop = Math.max(8, baseTop - scrollY);
        topControlBarRef.current.style.top = `${newTop}px`;

        // スクロールが一定量を超えた場合は上にスライド
        if (scrollY < baseTop) {
          topControlBarRef.current.style.transform = "translateY(0)";
        }
      }
    };

    const appElement = document.getElementById("app");
    if (appElement) {
      appElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (appElement) {
        appElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // キーボードショートカット
  useEffect(() => {
    const handlers = {
      handlePlayCurrentCode,
      handleStop,
      handleSelectCode,
    };

    const state = {
      jsonData,
      selectedCodeId,
    };

    const handleKeyDown = createKeyboardShortcutHandler(handlers, state);
    return setupKeyboardShortcuts(handleKeyDown);
  }, [jsonData, selectedCodeId]); // 依存関係を更新

  // 再生中にrepeatCountsやcodeOrderが変更された場合のリアルタイム反映
  useEffect(() => {
    if (isPlaying && currentPlayingCodeOrderId && codeOrder.length > 0) {
      // currentPlayingCodeOrderIdより後について新たなsequenceを作り直す
      handlePlay(false, currentPlayingCodeOrderId);
    }
  }, [repeatCounts, codeOrder]);

  // =================================================================
  // 関数
  // =================================================================

  /**
   * Reconfigures the editor's updateListener to update highlights when the content changes.
   */
  function reconfigureUpdateListener() {
    if (strudelEditorRef?.current?.editor?.editor) {
      // エディタの内容変更時にhighlightを更新
      strudelEditorRef.current.editor.editor.dispatch({
        effects: updateListenerCompartment.reconfigure(
          createUpdateListener(strudelEditorRef, isPlaying, evaluate)
        ),
      });
    }
  }

  /**
   * Handles changes to the common code state.
   * If checked is true, adds the code to commonCodes and removes it from codeOrder and repeatCounts.
   * If checked is false, removes the code from commonCodes.
   *
   * @param {string} id - The ID of the code block.
   * @param {boolean} checked - Whether the code is marked as common.
   */
  function handleCommonCodeChange(id, checked) {
    setCommonCodes((prev) => {
      if (checked) {
        // チェックした場合：追加
        return {
          ...prev,
          [id]: checked,
        };
      } else {
        // チェックを外した場合：削除
        const newCommonCodes = { ...prev };
        delete newCommonCodes[id];
        return newCommonCodes;
      }
    });

    // チェックの場合、codeOrderからも削除
    if (checked) {
      setCodeOrder((prev) => prev.filter((block) => block.id !== id));
      setRepeatCounts((prev) => {
        const newCounts = { ...prev };
        // 該当するcodeOrderIdを持つブロックのrepeatCountも削除
        Object.keys(newCounts).forEach((codeOrderId) => {
          if (codeOrderId.startsWith(`${id}_`)) {
            delete newCounts[codeOrderId];
          }
        });
        return newCounts;
      });
    }
  }

  // =================================================================
  // コードリスト・エディタ関連
  // =================================================================

  /**
   * エディタの内容変更をjsonData, codeList, codeOrderに反映
   * @param {string} value - エディタの新しい内容
   */
  function handleEditorChange(value) {
    const result = updateCodeFromEditor(value, selectedCodeId, jsonData);
    setJsonData(result.jsonData);

    // 選択中のコードがcommon codeの場合、commonCodesも更新
    if (selectedCodeId && commonCodes[selectedCodeId]) {
      setCommonCodes((prev) => ({
        ...prev,
        [selectedCodeId]: true, // 更新されたコードをcommon codeとして保持
      }));
    }
  }

  /**
   * コード選択時に呼ばれる
   * @param {string} id - 選択したコードのID
   * @param {string} code - 選択したコードの内容
   */
  function handleSelectCode(id, code) {
    handleStop();
    setSelectedCodeId(id);
    strudelEditorRef.current.editor.setCode(code);
    evaluate(code, null, false, id);
  }

  /**
   * JSONファイルを読み込んでコードリスト・データをセットする
   * @param {Event} e - ファイル選択イベント
   */
  async function handleJsonFileChange(e) {
    try {
      const result = await loadJsonFile(e);
      if (result) {
        setJsonData(result.jsonData);
        setSelectedCodeId(result.firstId);
        setCodeOrder([]);
        setRepeatCounts({});
        // ここでeditorにも反映
        if (result.firstCode && strudelEditorRef.current) {
          strudelEditorRef.current.editor.setCode(result.firstCode);
        }
      }
    } catch (err) {
      console.error("JSONファイルの読み込みに失敗しました:", err);
    }
  }

  /**
   * 選択されたコードを削除する
   */
  function handleDeleteSelectedCode() {
    const result = deleteSelectedCode(selectedCodeId, jsonData);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);
  }

  /**
   * 選択中のコードを複製する
   */
  function handleDuplicateSelectedCode() {
    const result = duplicateSelectedCode(selectedCodeId, jsonData);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);
  }

  /**
   * 新規コードブロックを作成する
   */
  function handleCreateNewCode() {
    const result = createNewCode(jsonData);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);

    // エディタに新規作成されたコードを表示
    if (strudelEditorRef.current && result.selectedCodeId) {
      const newCode = result.jsonData[result.selectedCodeId]?.code || "";
      strudelEditorRef.current.editor.setCode(newCode);
    }
  }

  // =================================================================
  // DnD行関連
  // =================================================================

  /**
   * DnD: ドラッグ開始時に呼ばれる
   * @param {object} event - DnDイベント
   */
  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  /**
   * DnD: コード順からブロックを削除する
   * @param {string} codeOrderId - 削除するコード順のcodeOrderId
   */
  function handleRemoveFromRow(codeOrderId) {
    const result = removeFromRow(codeOrder, repeatCounts, codeOrderId);
    setCodeOrder(result.codeOrder);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * コード順の小節数入力変更時に呼ばれる
   * @param {string} codeOrderId - 対象コード順のcodeOrderId
   * @param {string} value - 入力値
   */
  function handleRepeatChange(codeOrderId, value) {
    const newRepeatCounts = updateRepeatCount(repeatCounts, codeOrderId, value);
    setRepeatCounts(newRepeatCounts);
  }

  /**
   * すべてのコードを一気にDnD行に追加（共通コードは除外）
   */
  function handleAddAllToRow() {
    const result = addAllToRow(codeOrder, repeatCounts, jsonData, commonCodes);
    setCodeOrder(result.codeOrder);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * コード順の並び替え・DnDドロップ時のハンドラ
   * @param {object} event - DnDイベント
   */
  function handleCodeOrderDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const result = codeOrderDragEnd(
      codeOrder,
      repeatCounts,
      jsonData,
      active.id,
      over.id,
      arrayMove
    );
    setCodeOrder(result.codeOrder);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * コード一覧からコード順にブロックを追加する
   * @param {string} id - 追加するコードのID
   */
  function handleAddBlockToCodeOrder(id) {
    const result = addBlockToCodeOrder(
      codeOrder,
      repeatCounts,
      id,
      selectedCodeOrderId
    );
    setCodeOrder(result.codeOrder);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * コード順の全ブロックを削除する（全て削除ボタン用）
   */
  function handleDeleteAllCodes() {
    const result = deleteAllCodes();
    setCodeOrder(result.codeOrder);
    setRepeatCounts(result.repeatCounts);
    setSelectedCodeOrderId(null);
    setCurrentPlayingCodeOrderId(null);
  }

  // =================================================================
  // コード再生・シーケンス関連
  // =================================================================

  /**
   * 再生ボタン押下時のハンドラ
   */
  function handlePlay(shouldStop = true, timeoutClearStartCodeOrderId = null) {
    if (shouldStop) {
      handleStop();
    }

    reconfigureUpdateListener();
    let startIdx = 0;
    let accumulatedTime = 0;

    // 再生中のもの以外を作り直す
    if (timeoutClearStartCodeOrderId) {
      const clearStartIndex = codeOrder.findIndex(
        (b) => b.codeOrderId === timeoutClearStartCodeOrderId
      );

      if (clearStartIndex !== -1) {
        // timeoutClearStartCodeOrderId以外のtimeoutを全てclear
        for (const [
          codeOrderId,
          timeouts,
        ] of currentTimeoutsRef.current.entries()) {
          if (codeOrderId !== timeoutClearStartCodeOrderId) {
            timeouts.forEach(clearTimeout);
            currentTimeoutsRef.current.delete(codeOrderId);
          }
        }

        // 開始位置
        startIdx = clearStartIndex + 1;

        // timeoutClearStartCodeOrderIdが設定されている場合の時間計算
        if (playbackEndTime) {
          const now = new Date();
          accumulatedTime = playbackEndTime - now;
        }
      }
    } else {
      // 全てのtimeoutをクリア
      for (const timeouts of currentTimeoutsRef.current.values()) {
        timeouts.forEach(clearTimeout);
      }
      currentTimeoutsRef.current.clear();

      // 選択行から再生
      if (selectedCodeOrderId) {
        const idx = codeOrder.findIndex(
          (b) => b.codeOrderId === selectedCodeOrderId
        );
        if (idx !== -1) startIdx = idx;
      }
    }

    // 再生開始時間を計算
    for (let i = startIdx; i < codeOrder.length; i++) {
      const { codeOrderId, id } = codeOrder[i];
      const code = jsonData[id]?.code || "";
      let repeat = parseInt(repeatCounts[codeOrderId], 10);
      if (isNaN(repeat) || repeat <= 0) repeat = 8;
      let bpmVal = parseInt(bpm, 10);
      if (isNaN(bpmVal) || bpmVal <= 0) bpmVal = 120;

      // 1小節の長さ(秒) = 60 / BPM * 4 (4拍子)
      const barSec = (60 / bpmVal) * 4;
      const totalWait = barSec * repeat * 1000;

      // evaluateを実行するtimeout
      const evaluateTimer = setTimeout(() => {
        evaluate(code, null, false, id);
        setSelectedCodeId(id);
        setCurrentPlayingCodeOrderId(codeOrderId);
        setPlaybackEndTime(new Date(Date.now() + totalWait));
        strudelEditorRef.current.editor.setCode(code);
      }, accumulatedTime);

      // hushを実行するtimeout
      const hushTimer = setTimeout(() => {
        if (strudelEditorRef?.current?.editor?.repl?.stop) {
          strudelEditorRef.current.editor.repl.stop();
        }
      }, accumulatedTime + totalWait - hushBeforeMs);

      // timeout IDを保存（codeOrderIdごとに管理）
      const timeouts = [evaluateTimer, hushTimer];

      // 最後のブロックの場合は再生完了処理
      if (i === codeOrder.length - 1) {
        const finishTimer = setTimeout(() => {
          setCurrentPlayingCodeOrderId(null);
          setIsPlaying(false);
        }, accumulatedTime + totalWait);
        timeouts.push(finishTimer);
      }

      currentTimeoutsRef.current.set(codeOrderId, timeouts);

      // 次のブロックの開始時間を計算
      accumulatedTime += totalWait;
    }

    setIsPlaying(true);
  }

  /**
   * 停止ボタン押下時のハンドラ
   */
  function handleStop() {
    // 現在再生中のtimeoutを全てクリア
    for (const timeouts of currentTimeoutsRef.current.values()) {
      timeouts.forEach(clearTimeout);
    }
    currentTimeoutsRef.current.clear();

    strudelEditorRef.current.editor.stop();
    setCurrentPlayingCodeOrderId(null);
    setIsPlaying(false);
    setPlaybackEndTime(null);
  }

  /**
   * 最初から再生ボタン押下時のハンドラ
   */
  function handlePlayFromStart() {
    if (codeOrder.length === 0) return;
    if (selectedCodeOrderId !== null) {
      playFromStartFlag.current = true;
      setSelectedCodeOrderId(null);
    } else {
      handlePlay();
    }
  }

  /**
   * 現在表示しているコードを再生する
   * @param {Event} e - イベント
   */
  async function handlePlayCurrentCode(e) {
    try {
      handleStop();
      reconfigureUpdateListener();
      const selectedCode = selectedCodeId
        ? jsonData[selectedCodeId]?.code || ""
        : "";
      if (!selectedCode || selectedCode.trim() === "") {
        throw new Error("再生するコードがありません");
      }

      try {
        evaluate(selectedCode, null, true);
      } catch (error) {
        console.error("コードの実行に失敗しました:", error);
        throw new Error("コードの実行に失敗しました");
      }
    } catch (error) {
      alert(error.message);
    }
  }

  // =================================================================
  // エクスポート・インポート関連
  // =================================================================

  /**
   * コードリストをJSON形式でエクスポートする
   */
  function handleExportJson() {
    exportJson(jsonData);
  }

  /**
   * DnD行の並び順をエクスポートする
   */
  function handleExportCodesRowOrder() {
    exportCodesRowOrder(codeOrder, repeatCounts);
  }

  /**
   * DnD行の並び順をインポートする
   * @param {Event} e - ファイル選択イベント
   */
  async function handleImportCodesRowOrder(e) {
    try {
      const result = await importCodesRowOrder(e, jsonData);
      if (result) {
        setCodeOrder(result.codeOrder);
        setRepeatCounts(result.repeatCounts);
        setSelectedCodeOrderId(null);
      }
    } catch (err) {
      console.error("インポートに失敗しました:", err);
    }
  }

  /**
   * 全状態をエクスポートする
   */
  function handleExportAllState() {
    // codeOrderからcodeを除外したバージョンを作成
    const codeOrderForExport = codeOrder.map(({ id, codeOrderId }) => ({
      id,
      codeOrderId,
    }));

    const state = {
      jsonData,
      codeOrder: codeOrderForExport,
      repeatCounts,
      commonCodes,
      bpm,
      hushBeforeMs,
    };
    exportAllState(state);
  }

  /**
   * 全状態をインポートする
   * @param {Event} e - ファイル選択イベント
   */
  async function handleImportAllState(e) {
    try {
      const importData = await importAllState(e);
      if (importData) {
        // 各状態を復元
        if (importData.jsonData) setJsonData(importData.jsonData);
        if (importData.codeOrder) setCodeOrder(importData.codeOrder);
        if (importData.repeatCounts) setRepeatCounts(importData.repeatCounts);
        if (importData.commonCodes) setCommonCodes(importData.commonCodes);
        if (importData.bpm) setBpm(importData.bpm);
        if (importData.hushBeforeMs) setHushBeforeMs(importData.hushBeforeMs);

        // 選択状態をリセットし、最初のコードをeditorに表示
        const codeList = getCodeListFromJsonData(importData.jsonData || {});
        const firstId = codeList[0]?.id || null;
        setSelectedCodeId(firstId);
        if (codeList[0] && strudelEditorRef.current) {
          strudelEditorRef.current.editor.setCode(codeList[0].code);
        }
        setSelectedCodeOrderId(null);
      }
    } catch (err) {
      console.error("インポートに失敗しました:", err);
    }
  }

  // =================================================================
  // その他
  // =================================================================

  /**
   * BPM入力変更時のハンドラ
   * @param {Event} e - 入力イベント
   */
  function handleBpmChange(e) {
    setBpm(e.target.value.replace(/[^0-9]/g, ""));
  }

  /**
   * hushBeforeMs入力変更時のハンドラ
   * @param {Event} e - 入力イベント
   */
  function handleHushBeforeMsChange(e) {
    setHushBeforeMs(Number(e.target.value.replace(/[^0-9]/g, "")));
  }

  /**
   * コード一覧のDnD並び替え時のハンドラ
   * @param {object} event - DnDイベント
   */
  function handleCodeListDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const codeList = getCodeListFromJsonData(jsonData);
    const oldIndex = codeList.findIndex((b) => b.id === active.id);
    const newIndex = codeList.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCodeList = arrayMove(codeList, oldIndex, newIndex);
      const newJsonData = {};

      // 新しい順序に基づいてjsonDataを更新（orderは使用しない）
      newCodeList.forEach((item) => {
        if (jsonData[item.id]) {
          newJsonData[item.id] = {
            ...jsonData[item.id],
          };
        }
      });

      setJsonData(newJsonData);
    }
  }

  // =================================================================
  // リサイザー関連
  // =================================================================

  /**
   * リサイザーのマウスダウンイベント
   */
  function handleResizerMouseDown(e) {
    e.preventDefault();
    setIsResizing(true);
  }

  /**
   * マウス移動時の横幅調整
   */
  useEffect(() => {
    function handleMouseMove(e) {
      if (!isResizing) return;

      const containerRect = document
        .querySelector(".w-full.h-full.flex.flex-row")
        .getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const newEditorWidth = (mouseX / containerRect.width) * 100;

      // 最小・最大幅を制限
      if (newEditorWidth >= 20 && newEditorWidth <= 80) {
        setEditorWidth(newEditorWidth);
        localStorage.setItem(
          "strudeler-editor-width",
          newEditorWidth.toString()
        );
      }
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className="w-full h-full flex flex-row"
      style={{ flex: 1, minHeight: "600px" }}
    >
      {/* コード順管理 */}
      <div
        ref={topControlBarRef}
        className="w-full p-4 pt-3 pb-5 flex flex-col items-center border-b border-gray-700 bg-base-100 transition-transform duration-300"
        style={{
          position: "absolute",
          top: 56,
          width: "calc(100% - 16px)",
          zIndex: 1,
        }}
      >
        <TopControlBar
          hushBeforeMs={hushBeforeMs}
          handleHushBeforeMsChange={handleHushBeforeMsChange}
          bpm={bpm}
          handleBpmChange={handleBpmChange}
          handlePlayFromStart={handlePlayFromStart}
          codeOrder={codeOrder}
          handlePlay={handlePlay}
          handleStop={handleStop}
          isPlaying={isPlaying}
          handleExportCodesRowOrder={handleExportCodesRowOrder}
          importCodesRowInputRef={importCodesRowInputRef}
          handleImportCodesRowOrder={handleImportCodesRowOrder}
          handleExportAllState={handleExportAllState}
          importAllStateInputRef={importAllStateInputRef}
          handleImportAllState={handleImportAllState}
          handleDeleteAllCodes={handleDeleteAllCodes}
        />
        <div
          className="flex flex-row items-end gap-0 min-h-[72px] w-full overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
          style={{ WebkitOverflowScrolling: "touch" }}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* コード順管理 */}
          <CodeOrderManager
            codeOrder={codeOrder}
            handleCodeOrderDragEnd={handleCodeOrderDragEnd}
            handleDragStart={handleDragStart}
            repeatCounts={repeatCounts}
            handleRemoveFromRow={handleRemoveFromRow}
            handleRepeatChange={handleRepeatChange}
            activeId={activeId}
            currentPlayingCodeOrderId={currentPlayingCodeOrderId}
            setSelectedCodeOrderId={setSelectedCodeOrderId}
            selectedCodeOrderId={selectedCodeOrderId}
            jsonData={jsonData}
          />
        </div>
      </div>
      {/* Strudel Editor */}
      <div
        className="flex flex-col p-4"
        style={{
          width: `${editorWidth}%`,
          marginTop: 88,
          height: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        {/* エディタ上のボタン群 */}
        <EditorControls
          strudelEditorRef={strudelEditorRef}
          onFlashChange={(showFlash) => setShowFlash(showFlash)}
          onHighlightChange={(shouldHighlight) =>
            setShouldHighlight(shouldHighlight)
          }
        />
        {/* エラー表示 */}
        <ErrorDisplay
          error={evaluateError}
          onClose={() => setEvaluateError(null)}
        />
        <strudel-editor id="repl" ref={strudelEditorRef}></strudel-editor>
      </div>

      {/* リサイザー */}
      <div
        ref={resizerRef}
        className={`w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize ${
          isResizing ? "bg-gray-400" : ""
        }`}
        style={{
          marginTop: 88,
          height: "calc(100vh - 160px)",
          minWidth: "4px",
        }}
        onMouseDown={handleResizerMouseDown}
      ></div>

      {/* コード一覧 */}
      <div
        className="flex flex-col h-full p-4 mb-4 overflow-y-auto"
        style={{
          width: `${100 - editorWidth}%`,
          marginTop: 92,
        }}
      >
        {/* ボタン群 */}
        <CodeListButtons
          jsonFileInputRef={jsonFileInputRef}
          handleJsonFileChange={handleJsonFileChange}
          handleAddAllToRow={handleAddAllToRow}
          handleExportJson={handleExportJson}
          jsonData={jsonData}
          handleDeleteSelectedCode={handleDeleteSelectedCode}
          selectedCodeId={selectedCodeId}
          handleDuplicateSelectedCode={handleDuplicateSelectedCode}
          handleCreateNewCode={handleCreateNewCode}
          handlePlayCurrentCode={handlePlayCurrentCode}
          handleStop={handleStop}
        />

        {/* コード一覧DnD */}
        <CodeListDnD
          jsonData={jsonData}
          handleCodeListDragEnd={handleCodeListDragEnd}
          verticalListSortingStrategy={verticalListSortingStrategy}
          commonCodes={commonCodes}
          handleSelectCode={handleSelectCode}
          selectedCodeId={selectedCodeId}
          handleAddBlockToCodeOrder={handleAddBlockToCodeOrder}
          handleCommonCodeChange={handleCommonCodeChange}
        />
      </div>
    </div>
  );
}

export default Strudeler;
