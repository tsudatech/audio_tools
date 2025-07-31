import React, { useRef, useState, useEffect } from "react";
import "./strudel/repl/repl-component.mjs";
import { initAudioOnFirstClick } from "@strudel/webaudio";
import { arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TopControlBar from "./TopControlBar";
import EditorControls from "./EditorControls";
import DndRowManager from "./DndRowManager";
import CodeListDnD from "./CodeListDnD";
import CodeListButtons from "./CodeListButtons";
import {
  exportJson,
  exportCodesRowOrder,
  importCodesRowOrder,
  exportAllState,
  importAllState,
} from "./utils/exportImportUtils";
import { createCommonCodeManager } from "./utils/commonCodeUtils";
import {
  loadJsonFile,
  updateCodeFromEditor,
  deleteSelectedCode,
  duplicateSelectedCode,
  createNewCode,
  reorderCodeList,
} from "./utils/codeListEditorUtils";
import {
  playSequence,
  playCurrentCode,
  PlaybackManager,
} from "./utils/playbackUtils";

function Strudeler() {
  // Data State
  const [jsonData, setJsonData] = useState({});
  const [codeList, setCodeList] = useState([]);
  const [commonCodes, setCommonCodes] = useState({});

  // Editor State
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedCodeId, setSelectedCodeId] = useState(null);

  // Playback State
  const [bpm, setBpm] = useState(172);
  const [hushBeforeMs, setHushBeforeMs] = useState(150);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackManager = useRef(new PlaybackManager());

  // DnD Row State
  const [dndRow, setDndRow] = useState([]);
  const [repeatCounts, setRepeatCounts] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [currentPlayingRowId, setCurrentPlayingRowId] = useState(null);
  const [selectedDnDRowId, setSelectedDnDRowId] = useState(null);

  // Misc State
  const playFromStartFlag = useRef(false);

  // ファイル選択用ref
  const jsonFileInputRef = useRef(null);
  const importCodesRowInputRef = useRef(null);
  const importAllStateInputRef = useRef(null);
  const strudelEditorRef = useRef(null);

  // 共通コードマネージャーのインスタンス
  const commonCodeManager = createCommonCodeManager({
    strudelEditorRef,
    commonCodes,
    codeList,
    jsonData,
    onCommonCodeChange: handleEditorChange,
  });

  useEffect(() => {
    initAudioOnFirstClick();
  }, []);

  useEffect(() => {
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.setFontFamily("monospace");

      strudelEditorRef.current.editor.evaluate_with_p = async (code) => {
        strudelEditorRef.current.editor.flash();
        strudelEditorRef.current.editor.repl.evaluate(code);
      };

      strudelEditorRef.current.editor.editor.scrollDOM.style.height =
        "calc(100vh - 272px)";
    }
  }, [strudelEditorRef]);

  // selectedDnDRowIdの変更を監視して最初から再生を制御
  useEffect(() => {
    if (playFromStartFlag.current && selectedDnDRowId === null) {
      playFromStartFlag.current = false;
      handlePlay();
    }
  }, [selectedDnDRowId]);

  // PlaybackManagerの状態を監視
  useEffect(() => {
    const checkPlayingState = () => {
      setIsPlaying(playbackManager.current.isPlaying);
    };

    const interval = setInterval(checkPlayingState, 100);
    return () => clearInterval(interval);
  }, []);

  // キーボードショートカット
  useEffect(() => {
    function handleKeyDown(event) {
      // editorにfocusが当たっている場合は無視
      const activeElement = document.activeElement;
      // CodeMirrorエディタのフォーカス判定
      if (
        activeElement &&
        (activeElement.classList?.contains("cm-content") ||
          activeElement.closest?.(".cm-editor"))
      ) {
        // ctrl + enterの場合はhandleEditorChangeを呼ぶ
        if (event.ctrlKey && event.key === "Enter") {
          event.preventDefault();
          commonCodeManager.evaluateCommonCode();
        }

        // ctrl + . の場合はhandleStopを呼ぶ
        if (event.ctrlKey && event.key === ".") {
          event.preventDefault();
          handleStop(event);
        }
        return;
      }

      // Ctrl+Enter: 再生
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        handlePlayCurrentCode(event);
      }
      // Ctrl+. : 停止
      if (event.ctrlKey && event.key === ".") {
        event.preventDefault();
        handleStop(event);
      }
      // 上下キー: コード一覧の選択変更
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const currentIndex = codeList.findIndex(
          (item) => item.id === selectedCodeId
        );
        if (currentIndex === -1) return;

        let newIndex;
        if (event.key === "ArrowUp") {
          newIndex = currentIndex > 0 ? currentIndex - 1 : codeList.length - 1;
        } else {
          newIndex = currentIndex < codeList.length - 1 ? currentIndex + 1 : 0;
        }

        const newSelectedItem = codeList[newIndex];
        if (newSelectedItem) {
          handleSelectCode(newSelectedItem.id, newSelectedItem.code);

          // 選択されたアイテムが画面外にある場合はスクロール
          setTimeout(() => {
            const selectedElement = document.querySelector(
              `[data-code-id="${newSelectedItem.id}"]`
            );
            if (selectedElement) {
              selectedElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          }, 0);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCode, codeList, selectedCodeId]); // 依存関係を更新

  // 共通コード状態の変更
  function handleCommonCodeChange(id, checked) {
    setCommonCodes((prev) => ({
      ...prev,
      [id]: checked,
    }));
  }

  // =========================
  // コードリスト・エディタ関連
  // =========================

  /**
   * Monacoエディタの内容変更時に呼ばれる
   * @param {string} value - エディタの新しい内容
   */
  function handleEditorChange(value) {
    setSelectedCode(value);
    const result = updateCodeFromEditor(
      value,
      selectedCodeId,
      codeList,
      jsonData,
      dndRow
    );
    setCodeList(result.codeList);
    setJsonData(result.jsonData);
    setDndRow(result.dndRow);
  }

  /**
   * コード選択時に呼ばれる
   * @param {string} id - 選択したコードのID
   * @param {string} code - 選択したコードの内容
   */
  function handleSelectCode(id, code) {
    setSelectedCodeId(id);
    setSelectedCode(code);
    strudelEditorRef.current.editor.setCode(code);
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
        setCodeList(result.codes);
        setSelectedCode(result.firstCode);
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
    const result = deleteSelectedCode(selectedCodeId, codeList, jsonData);
    setCodeList(result.codeList);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);
    setSelectedCode(result.selectedCode);
  }

  /**
   * 選択中のコードを複製する
   */
  function handleDuplicateSelectedCode() {
    const result = duplicateSelectedCode(selectedCodeId, codeList, jsonData);
    setCodeList(result.codeList);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);
    setSelectedCode(result.selectedCode);
  }

  /**
   * 新規コードブロックを作成する
   */
  function handleCreateNewCode() {
    const result = createNewCode(codeList, jsonData);
    setCodeList(result.codeList);
    setJsonData(result.jsonData);
    setSelectedCodeId(result.selectedCodeId);
    setSelectedCode(result.selectedCode);
  }

  // =========================
  // DnD行関連
  // =========================

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
    setDndRow(dndRow.filter((b) => b.rowId !== rowId));
    setRepeatCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[rowId];
      return newCounts;
    });
  }

  /**
   * DnD行の小節数入力変更時に呼ばれる
   * @param {string} rowId - 対象DnD行のrowId
   * @param {string} value - 入力値
   */
  function handleRepeatChange(rowId, value) {
    setRepeatCounts((prev) => ({
      ...prev,
      [rowId]: value.replace(/[^0-9]/g, ""),
    }));
  }

  /**
   * すべてのコードを一気にDnD行に追加（共通コードは除外）
   */
  function handleAddAllToRow() {
    const now = Date.now();
    const nonCommonBlocks = codeList.filter((block) => !commonCodes[block.id]);
    const newBlocks = nonCommonBlocks.map((block, idx) => ({
      ...block,
      rowId: `${block.id}_${now}_${idx}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    }));
    setDndRow([...dndRow, ...newBlocks]);
    setRepeatCounts((prev) => {
      const newCounts = { ...prev };
      newBlocks.forEach((b) => {
        newCounts[b.rowId] = "";
      });
      return newCounts;
    });
  }

  /**
   * DnD行の並び替え・DnDドロップ時のハンドラ
   * @param {object} event - DnDイベント
   */
  function handleDndRowDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = dndRow.findIndex((b) => b.rowId === active.id);
    const newIndex = dndRow.findIndex((b) => b.rowId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setDndRow(arrayMove(dndRow, oldIndex, newIndex));
    } else {
      // 右側からDnD行へ
      const block = codeList.find((b) => b.id === active.id);
      if (block) {
        const rowId = `${block.id}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const insertIdx = newIndex !== -1 ? newIndex : dndRow.length;
        const newRow = [...dndRow];
        newRow.splice(insertIdx, 0, { ...block, rowId });
        setDndRow(newRow);
        setRepeatCounts((prev) => ({ ...prev, [rowId]: "" }));
      }
    }
  }

  /**
   * コード一覧からDnD行にブロックを追加する
   * @param {string} id - 追加するコードのID
   * @param {string} code - 追加するコードの内容
   */
  function handleAddBlockToDnDRow(id, code) {
    // 追加位置: 選択中DnDブロックの次
    let insertIdx = dndRow.length;
    if (selectedDnDRowId) {
      const idx = dndRow.findIndex((b) => b.rowId === selectedDnDRowId);
      if (idx !== -1) insertIdx = idx + 1;
    }
    const rowId = `${id}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const newRow = [...dndRow];
    newRow.splice(insertIdx, 0, { id, code, rowId });
    setDndRow(newRow);
    setRepeatCounts((prev) => ({ ...prev, [rowId]: "" }));
  }

  /**
   * DnD行の全ブロックを削除する（全て削除ボタン用）
   */
  function handleDeleteAllCodes() {
    setDndRow([]);
    setRepeatCounts({});
    setSelectedDnDRowId(null);
    setCurrentPlayingRowId(null);
  }

  // =========================
  // コード再生・シーケンス関連
  // =========================

  /**
   * 再生ボタン押下時のハンドラ
   */
  function handlePlay() {
    playbackManager.current.start(playSequence, {
      dndRow,
      repeatCounts,
      selectedDnDRowId,
      bpm,
      hushBeforeMs,
      evaluateCommonCode: commonCodeManager.evaluateCommonCode,
      onProgress: (index, row, action, data) => {
        // "hush"アクション時はエディタの再生停止
        if (action === "hush") {
          strudelEditorRef.current.editor.stop();
        }

        // 現在再生中のrowIdをセット
        setCurrentPlayingRowId(row.rowId);
      },
      // 再生完了時のコールバック
      onComplete: () => {
        setCurrentPlayingRowId(null);
      },

      // エラー発生時のコールバック
      onError: (error) => {
        console.error("再生エラー:", error);
        setCurrentPlayingRowId(null);
      },
    });
  }

  /**
   * 停止ボタン押下時のハンドラ
   */
  function handleStop() {
    playbackManager.current.stop(() => {
      strudelEditorRef.current.editor.stop();
    });
    setCurrentPlayingRowId(null);
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
      await playCurrentCode(selectedCode, commonCodeManager.evaluateCommonCode);
    } catch (error) {
      alert(error.message);
    }
  }

  // =========================
  // エクスポート・インポート関連
  // =========================

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
      const result = await importCodesRowOrder(e, codeList, jsonData);
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
    const state = {
      jsonData,
      codeList,
      dndRow,
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
        if (importData.codeList) setCodeList(importData.codeList);
        if (importData.dndRow) setDndRow(importData.dndRow);
        if (importData.repeatCounts) setRepeatCounts(importData.repeatCounts);
        if (importData.commonCodes) setCommonCodes(importData.commonCodes);
        if (importData.bpm) setBpm(importData.bpm);
        if (importData.hushBeforeMs) setHushBeforeMs(importData.hushBeforeMs);

        // 選択状態をリセットし、最初のコードをeditorに表示
        const firstCode = importData.codeList?.[0]?.code || "";
        const firstId = importData.codeList?.[0]?.id || null;
        setSelectedCode(firstCode);
        setSelectedCodeId(firstId);
        if (
          importData.codeList &&
          importData.codeList[0] &&
          strudelEditorRef.current
        ) {
          strudelEditorRef.current.editor.setCode(importData.codeList[0].code);
        }
        setSelectedDnDRowId(null);
      }
    } catch (err) {
      console.error("インポートに失敗しました:", err);
    }
  }

  // =========================
  // その他
  // =========================

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
    const oldIndex = codeList.findIndex((b) => b.id === active.id);
    const newIndex = codeList.findIndex((b) => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newCodeList = arrayMove(codeList, oldIndex, newIndex);
      const result = reorderCodeList(newCodeList, jsonData, oldIndex, newIndex);
      setCodeList(result.codeList);
      setJsonData(result.jsonData);
    }
  }

  return (
    <div
      className="w-full h-full flex flex-row"
      style={{ flex: 1, minHeight: "600px" }}
    >
      {/* コード順管理 */}
      <div
        className="w-full z-10 p-4 flex flex-col items-center border-b border-gray-700 bg-base-100"
        style={{ position: "absolute", top: 56 }}
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
          />
        </div>
      </div>
      {/* Strudel Editor */}
      <div
        className="flex flex-col w-2/3 p-4 border-r border-gray-200"
        style={{
          marginTop: 88,
          height: "calc(100vh - 240px)",
          overflowY: "auto",
        }}
      >
        {/* エディタ上のボタン群 */}
        <EditorControls strudelEditorRef={strudelEditorRef} />

        <strudel-editor id="repl" ref={strudelEditorRef}></strudel-editor>
      </div>
      {/* コード一覧 */}
      <div
        className="flex flex-col w-1/3 h-full p-4 overflow-y-auto"
        style={{ marginTop: 88 }}
      >
        {/* タイトル行 */}
        <div className="text-lg font-bold mb-4">コード一覧</div>

        {/* ボタン群 */}
        <CodeListButtons
          jsonFileInputRef={jsonFileInputRef}
          handleJsonFileChange={handleJsonFileChange}
          handleAddAllToRow={handleAddAllToRow}
          codeList={codeList}
          handleExportJson={handleExportJson}
          jsonData={jsonData}
          handleDeleteSelectedCode={handleDeleteSelectedCode}
          selectedCodeId={selectedCodeId}
          handleDuplicateSelectedCode={handleDuplicateSelectedCode}
          handleCreateNewCode={handleCreateNewCode}
          handlePlayCurrentCode={handlePlayCurrentCode}
          selectedCode={selectedCode}
          handleStop={handleStop}
        />

        {/* コード一覧DnD */}
        <CodeListDnD
          codeList={codeList}
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
