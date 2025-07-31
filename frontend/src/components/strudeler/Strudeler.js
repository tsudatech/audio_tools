import React, { useRef, useState, useEffect } from "react";
import { arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { initAudioOnFirstClick } from "@strudel/webaudio";
import "./strudel/repl/repl-component.mjs";
import CodeListButtons from "./CodeListButtons";
import CodeListDnD from "./CodeListDnD";
import DndRowManager from "./DndRowManager";
import EditorControls from "./EditorControls";
import TopControlBar from "./TopControlBar";
import { generateId, deleteFirstNLines } from "./utils";
import {
  exportJson,
  exportCodesRowOrder,
  importCodesRowOrder,
  exportAllState,
  importAllState,
} from "./exportImportUtils";
import createCommonCodeManager from "./CommonCodeManager";

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
  const playIndexRef = useRef(0);
  const stopFlag = useRef(false);
  const timeoutsRef = useRef([]);

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
    // jsonDataとcodeListも更新
    // どのidのコードか特定
    const found = codeList.find((item) => item.id === selectedCodeId);
    if (found) {
      // codeList更新
      setCodeList((prev) =>
        prev.map((item) =>
          item.id === found.id ? { ...item, code: value } : item
        )
      );
      // jsonData更新
      setJsonData((prev) => ({
        ...prev,
        [found.id]: {
          ...prev[found.id],
          code: value,
        },
      }));

      // dndRowの該当コードも更新
      setDndRow((prev) =>
        prev.map((item) =>
          item.id === found.id ? { ...item, code: value } : item
        )
      );
    }
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
  function handleJsonFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setJsonData(json);
        // 添付JSONの形式: { id: { code: '...', ... }, ... }
        const codes = Object.entries(json).map(([id, item]) => ({
          id,
          code: item.code,
        }));
        setCodeList(codes);
        setSelectedCode(codes[0]?.code || "");
        setSelectedCodeId(codes[0]?.id || null);
        setDndRow([]);
        setRepeatCounts({});
        // ここでeditorにも反映
        if (codes[0] && strudelEditorRef.current) {
          strudelEditorRef.current.editor.setCode(codes[0].code);
        }
      } catch (err) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  /**
   * 選択されたコードを削除する
   */
  function handleDeleteSelectedCode() {
    if (!selectedCodeId) return;
    // codeListから削除
    const found = codeList.find((item) => item.id === selectedCodeId);
    if (!found) return;
    const newCodeList = codeList.filter((item) => item.id !== found.id);
    setCodeList(newCodeList);
    // jsonDataから削除
    const newJsonData = { ...jsonData };
    delete newJsonData[found.id];
    setJsonData(newJsonData);
    // Monacoエディタの選択をリセット
    setSelectedCodeId(null);
    setSelectedCode("");
  }

  /**
   * 選択中のコードを複製する
   */
  function handleDuplicateSelectedCode() {
    if (!selectedCodeId) return;
    const found = codeList.find((item) => item.id === selectedCodeId);
    if (!found) return;
    // 新しいIDを生成
    const newId = generateId();
    // タイトルに_copyを付与
    let newCode = found.code;
    if (/@title\s+(.+)/.test(newCode)) {
      newCode = newCode.replace(
        /(@title\s+)(.+)/,
        (_, p1, p2) => `${p1}${p2}_copy`
      );
    } else {
      newCode = `@title コピー\n` + newCode;
    }
    const newBlock = { id: newId, code: newCode };
    // 複製元の直下に挿入
    const foundIndex = codeList.findIndex((item) => item.id === found.id);
    const newCodeList = [...codeList];
    newCodeList.splice(foundIndex + 1, 0, newBlock);
    setCodeList(newCodeList);
    // jsonDataの順序も更新
    const newJsonData = {};
    newCodeList.forEach((item) => {
      if (jsonData[item.id]) {
        newJsonData[item.id] = jsonData[item.id];
      }
    });
    newJsonData[newId] = { ...(jsonData[found.id] || {}), code: newCode };
    setJsonData(newJsonData);
    setSelectedCodeId(newId);
    setSelectedCode(newCode);
  }

  /**
   * 新規コードブロックを作成する
   */
  function handleCreateNewCode() {
    const newId = generateId();
    const newCode = "/*\n@title 新規コード\n*/\n";
    const newBlock = { id: newId, code: newCode };
    setCodeList((prev) => [...prev, newBlock]);
    setJsonData((prev) => ({ ...prev, [newId]: { code: newCode } }));
    setSelectedCodeId(newId);
    setSelectedCode(newCode);
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
   * コード再生シーケンス（DnD行順）を実行する
   */
  async function playSequence() {
    // すべてのtimeoutをクリア
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    stopFlag.current = false;
    setIsPlaying(true);

    // DnD行の順で再生（DnD行の選択から）
    let startIdx = 0;
    if (selectedDnDRowId) {
      const idx = dndRow.findIndex((b) => b.rowId === selectedDnDRowId);
      if (idx !== -1) startIdx = idx;
    }

    for (let i = startIdx; i < dndRow.length; i++) {
      if (stopFlag.current) break;
      playIndexRef.current = i;
      const { rowId, code } = dndRow[i];
      setCurrentPlayingRowId(rowId); // 再生中のrowIdをセット
      let repeat = parseInt(repeatCounts[rowId], 10);
      if (isNaN(repeat) || repeat <= 0) repeat = 8;
      let bpmVal = parseInt(bpm, 10);
      if (isNaN(bpmVal) || bpmVal <= 0) bpmVal = 120;

      // コードを評価してeditorに反映
      commonCodeManager.evaluateCommonCode(code, false);

      // 1小節の長さ(秒) = 60 / BPM * 4 (4拍子)
      const barSec = (60 / bpmVal) * 4;
      const totalWait = barSec * repeat * 1000;
      await new Promise((resolve) => {
        // 終わる少し前にhush
        const hushTimer = setTimeout(() => {
          strudelEditorRef.current.editor.stop();
        }, totalWait - hushBeforeMs);

        // 指定小節数分待つ
        const mainTimer = setTimeout(() => {
          clearTimeout(hushTimer);
          resolve();
        }, totalWait);

        // timeout IDを保存
        timeoutsRef.current.push(hushTimer, mainTimer);
      });
    }
    setCurrentPlayingRowId(null);
    setIsPlaying(false);
    playIndexRef.current = 0;
  }

  /**
   * 再生ボタン押下時のハンドラ
   */
  function handlePlay() {
    handleStop();
    setTimeout(() => {
      playSequence();
    }, 100);
  }

  /**
   * 停止ボタン押下時のハンドラ
   */
  function handleStop() {
    stopFlag.current = true;
    setIsPlaying(false);
    playIndexRef.current = 0;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    strudelEditorRef.current.editor.stop();
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
  function handlePlayCurrentCode(e) {
    if (!selectedCode || selectedCode.trim() === "") {
      alert("再生するコードがありません");
      return;
    }

    try {
      commonCodeManager.evaluateCommonCode();
    } catch (e) {
      console.error("コードの実行に失敗しました:", e);
      alert("コードの実行に失敗しました");
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
      setCodeList(newCodeList);
      // jsonDataの順序もcodeListに合わせて並び替え
      const newJsonData = {};
      newCodeList.forEach((item) => {
        if (jsonData[item.id]) {
          newJsonData[item.id] = jsonData[item.id];
        }
      });
      setJsonData(newJsonData);
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
