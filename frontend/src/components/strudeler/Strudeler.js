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
import DndRowManager from "./DndRowManager";
import CodeListDnD from "./CodeListDnD";
import CodeListButtons from "./CodeListButtons";

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
  addBlockToDnDRow,
  deleteAllCodes,
  dndRowDragEnd,
} from "./utils/dndRowUtils";
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

// highlightを更新するためのコンパートメント
const updateListenerCompartment = new Compartment();
const createUpdateListener = (code, isPlaying) => {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged && isPlaying) {
      setTimeout(() => {
        // TODO: ここでhighlightを更新する
      }, 200);
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

  // DnD Row State
  const [dndRow, setDndRow] = useState([]);
  const [repeatCounts, setRepeatCounts] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [currentPlayingRowId, setCurrentPlayingRowId] = useState(null);
  const [selectedDnDRowId, setSelectedDnDRowId] = useState(null);

  // Misc State
  const playFromStartFlag = useRef(false);
  const currentTimeoutsRef = useRef([]);

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

  // 初期表示時にIndexedDBから全状態をロード
  useEffect(() => {
    loadJsonDataFromIndexedDB((loaded) => {
      if (loaded && typeof loaded === "object") {
        // 各状態を復元
        if (loaded.jsonData) setJsonData(loaded.jsonData);
        if (loaded.dndRow) setDndRow(loaded.dndRow);
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
        setSelectedDnDRowId(null);
      }
    });
  }, []);

  // 全状態が変更されるたびにIndexedDBへ自動保存
  useEffect(() => {
    if (jsonData && typeof jsonData === "object") {
      // dndRowからcodeを除外したバージョンを作成
      const dndRowForExport = dndRow.map(({ id, rowId }) => ({ id, rowId }));
      const state = {
        jsonData,
        dndRow: dndRowForExport,
        repeatCounts,
        commonCodes,
        bpm,
        hushBeforeMs,
      };
      saveJsonDataToIndexedDB(state);
    }
  }, [jsonData, dndRow, repeatCounts, commonCodes, bpm, hushBeforeMs]);

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

  // evaluateを上書き
  useEffect(() => {
    // editor上でctrl + enter押した際にevaluateが実行されるため、毎回上書きする
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.evaluate = evaluate;
    }
  }, [strudelEditorRef, showFlash, selectedCodeId, commonCodes, jsonData]);

  // =================================================================
  // useEffect
  // =================================================================
  useEffect(() => {
    initAudioOnFirstClick();
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

    if (strudelEditorRef?.current?.editor?.editor) {
      // エディタの内容変更時にhighlightを更新
      const editorCode =
        strudelEditorRef.current.editor.editor.state.doc.toString();
      strudelEditorRef.current.editor.editor.dispatch({
        effects: updateListenerCompartment.reconfigure(
          createUpdateListener(editorCode, isPlaying)
        ),
      });
    }
  }, [commonCodes, isPlaying]);

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
        "calc(100vh - 328px)";

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

  // selectedDnDRowIdの変更を監視して最初から再生を制御
  useEffect(() => {
    if (playFromStartFlag.current && selectedDnDRowId === null) {
      playFromStartFlag.current = false;
      handlePlay();
    }
  }, [selectedDnDRowId]);

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

  // =================================================================
  // 関数
  // =================================================================

  // 共通コード状態の変更
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

    // チェックの場合、DnD行からも削除
    if (checked) {
      setDndRow((prev) => prev.filter((block) => block.id !== id));
      setRepeatCounts((prev) => {
        const newCounts = { ...prev };
        // 該当するrowIdを持つブロックのrepeatCountも削除
        Object.keys(newCounts).forEach((rowId) => {
          if (rowId.startsWith(`${id}_`)) {
            delete newCounts[rowId];
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
   * エディタの内容変更をjsonData, codeList, dndRowに反映
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
        setDndRow([]);
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
   * DnD: DnD行からブロックを削除する
   * @param {string} rowId - 削除するDnD行のrowId
   */
  function handleRemoveFromRow(rowId) {
    const result = removeFromRow(dndRow, repeatCounts, rowId);
    setDndRow(result.dndRow);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * DnD行の小節数入力変更時に呼ばれる
   * @param {string} rowId - 対象DnD行のrowId
   * @param {string} value - 入力値
   */
  function handleRepeatChange(rowId, value) {
    const newRepeatCounts = updateRepeatCount(repeatCounts, rowId, value);
    setRepeatCounts(newRepeatCounts);
  }

  /**
   * すべてのコードを一気にDnD行に追加（共通コードは除外）
   */
  function handleAddAllToRow() {
    const result = addAllToRow(dndRow, repeatCounts, jsonData, commonCodes);
    setDndRow(result.dndRow);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * DnD行の並び替え・DnDドロップ時のハンドラ
   * @param {object} event - DnDイベント
   */
  function handleDndRowDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const result = dndRowDragEnd(
      dndRow,
      repeatCounts,
      jsonData,
      active.id,
      over.id,
      arrayMove
    );
    setDndRow(result.dndRow);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * コード一覧からDnD行にブロックを追加する
   * @param {string} id - 追加するコードのID
   */
  function handleAddBlockToDnDRow(id) {
    const result = addBlockToDnDRow(dndRow, repeatCounts, id, selectedDnDRowId);
    setDndRow(result.dndRow);
    setRepeatCounts(result.repeatCounts);
  }

  /**
   * DnD行の全ブロックを削除する（全て削除ボタン用）
   */
  function handleDeleteAllCodes() {
    const result = deleteAllCodes();
    setDndRow(result.dndRow);
    setRepeatCounts(result.repeatCounts);
    setSelectedDnDRowId(null);
    setCurrentPlayingRowId(null);
  }

  // =================================================================
  // コード再生・シーケンス関連
  // =================================================================

  /**
   * 再生ボタン押下時のハンドラ
   */
  async function handlePlay() {
    handleStop();

    // 現在再生中のtimeoutを全てクリア
    currentTimeoutsRef.current.forEach(clearTimeout);
    currentTimeoutsRef.current = [];

    try {
      // DnD行の順で再生（DnD行の選択から）
      let startIdx = 0;
      if (selectedDnDRowId) {
        const idx = dndRow.findIndex((b) => b.rowId === selectedDnDRowId);
        if (idx !== -1) startIdx = idx;
      }

      for (let i = startIdx; i < dndRow.length; i++) {
        const { rowId, id } = dndRow[i];
        const code = jsonData[id]?.code || "";

        // コードを評価してeditorに反映
        evaluate(code, null, false, id);
        setTimeout(() => {
          strudelEditorRef.current.editor.setCode(code);

          // 右側のコード一覧の選択を更新
          setSelectedCodeId(id);

          // 現在再生中のrowIdを設定（上部コード順での選択表示用）
          setCurrentPlayingRowId(rowId);
        }, 0);

        let repeat = parseInt(repeatCounts[rowId], 10);
        if (isNaN(repeat) || repeat <= 0) repeat = 8;
        let bpmVal = parseInt(bpm, 10);
        if (isNaN(bpmVal) || bpmVal <= 0) bpmVal = 120;

        // 1小節の長さ(秒) = 60 / BPM * 4 (4拍子)
        const barSec = (60 / bpmVal) * 4;
        const totalWait = barSec * repeat * 1000;
        await new Promise((resolve, reject) => {
          // 終わる少し前にhush
          const hushTimer = setTimeout(() => {
            if (strudelEditorRef?.current?.editor?.repl?.stop) {
              strudelEditorRef.current.editor.repl.stop();
            }
          }, totalWait - hushBeforeMs);

          // 指定小節数分待つ
          const mainTimer = setTimeout(() => {
            clearTimeout(hushTimer);
            resolve();
          }, totalWait);

          // timeout IDを保存
          currentTimeoutsRef.current.push(hushTimer, mainTimer);
        });
      }
    } finally {
      // 再生完了時にcurrentPlayingRowIdをリセット
      setCurrentPlayingRowId(null);
      handleStop();
      // すべてのtimeoutをクリア
      currentTimeoutsRef.current.forEach(clearTimeout);
    }
  }

  /**
   * 停止ボタン押下時のハンドラ
   */
  function handleStop() {
    // 現在再生中のtimeoutを全てクリア
    currentTimeoutsRef.current.forEach(clearTimeout);
    currentTimeoutsRef.current = [];

    strudelEditorRef.current.editor.stop();
    setCurrentPlayingRowId(null);
    setIsPlaying(false);
  }

  /**
   * 最初から再生ボタン押下時のハンドラ
   */
  function handlePlayFromStart() {
    if (dndRow.length === 0) return;
    if (selectedDnDRowId !== null) {
      playFromStartFlag.current = true;
      setSelectedDnDRowId(null);
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
    exportCodesRowOrder(dndRow, repeatCounts);
  }

  /**
   * DnD行の並び順をインポートする
   * @param {Event} e - ファイル選択イベント
   */
  async function handleImportCodesRowOrder(e) {
    try {
      const result = await importCodesRowOrder(e, jsonData);
      if (result) {
        setDndRow(result.dndRow);
        setRepeatCounts(result.repeatCounts);
        setSelectedDnDRowId(null);
      }
    } catch (err) {
      console.error("インポートに失敗しました:", err);
    }
  }

  /**
   * 全状態をエクスポートする
   */
  function handleExportAllState() {
    // dndRowからcodeを除外したバージョンを作成
    const dndRowForExport = dndRow.map(({ id, rowId }) => ({ id, rowId }));

    const state = {
      jsonData,
      dndRow: dndRowForExport,
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
        if (importData.dndRow) setDndRow(importData.dndRow);
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
        setSelectedDnDRowId(null);
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

      // 新しい順序に基づいてorderを更新
      newCodeList.forEach((item, index) => {
        if (jsonData[item.id]) {
          newJsonData[item.id] = {
            ...jsonData[item.id],
            order: index,
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
          dndRow={dndRow}
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
          {/* コード順管理DnD */}
          <DndRowManager
            dndRow={dndRow}
            handleDndRowDragEnd={handleDndRowDragEnd}
            handleDragStart={handleDragStart}
            repeatCounts={repeatCounts}
            handleRemoveFromRow={handleRemoveFromRow}
            handleRepeatChange={handleRepeatChange}
            activeId={activeId}
            currentPlayingRowId={currentPlayingRowId}
            setSelectedDnDRowId={setSelectedDnDRowId}
            selectedDnDRowId={selectedDnDRowId}
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
          height: "calc(100vh - 240px)",
          overflowY: "auto",
        }}
      >
        {/* エディタ上のボタン群 */}
        <EditorControls
          strudelEditorRef={strudelEditorRef}
          onFlashChange={(showFlash) => {
            // flash設定をStrudelerコンポーネントで管理
            setShowFlash(showFlash);
          }}
          onHighlightChange={(shouldHighlight) => {
            // highlight設定をStrudelerコンポーネントで管理
            setShouldHighlight(shouldHighlight);
          }}
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
          height: "calc(100vh - 240px)",
          minWidth: "4px",
        }}
        onMouseDown={handleResizerMouseDown}
      ></div>

      {/* コード一覧 */}
      <div
        className="flex flex-col h-full p-4 overflow-y-auto"
        style={{
          width: `${100 - editorWidth}%`,
          marginTop: 88,
        }}
      >
        {/* タイトル行 */}
        <div className="text-lg font-bold mb-4">コード一覧</div>

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
          handleAddBlockToDnDRow={handleAddBlockToDnDRow}
          handleCommonCodeChange={handleCommonCodeChange}
        />
      </div>
    </div>
  );
}

export default Strudeler;
