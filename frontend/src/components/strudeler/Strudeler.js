import React, { useRef, useState, useEffect } from "react";
import { EditorSelection } from "@codemirror/state";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { initAudioOnFirstClick } from "@strudel/webaudio";
import "./strudel/repl/repl-component.mjs";
import TopControlBar from "./TopControlBar";
import CodeListButtons from "./CodeListButtons";
import CodeListDnD from "./CodeListDnD";
import DndRowManager from "./DndRowManager";

// ランダムID生成（12桁英数字）
function generateId(len = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function deleteFirstNLines(view, n) {
  const doc = view.state.doc;
  const lastLine = doc.line(n); // n 行目（1-based）

  const transaction = view.state.update({
    changes: { from: 0, to: lastLine.to + 1 }, // +1 は改行も含める
    selection: EditorSelection.cursor(0),
    scrollIntoView: true,
  });

  view.dispatch(transaction);
}

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

  useEffect(() => {
    initAudioOnFirstClick();
  }, []);

  useEffect(() => {
    if (strudelEditorRef.current) {
      strudelEditorRef.current.editor.setTheme("tokyoNight");
      strudelEditorRef.current.editor.setFontSize(18);
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
          evaluateCommonCode();
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

  // 共通コードを評価
  function evaluateCommonCode(code = null, shouldUpdateEditor = true) {
    // 共通コードと結合してevaluate
    const commonCodeText = getCommonCodeText();
    // editorから最新のコードを取得
    const editorCode = code || strudelEditorRef.current.editor.code;
    const combinedCode = commonCodeText
      ? `${commonCodeText}\n\n${editorCode}`
      : editorCode;

    strudelEditorRef.current.editor.evaluate_with_p(combinedCode);
    if (shouldUpdateEditor) {
      handleEditorChange(editorCode);
    }
    deleteFirstNLinesWithDelay(combinedCode, commonCodeText);
  }

  // 共通コードを取得
  function getCommonCodeText() {
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

  function deleteFirstNLinesWithDelay(combinedCode, commonCodeText) {
    if (!strudelEditorRef.current) return;

    setTimeout(() => {
      strudelEditorRef.current.editor.setCode(combinedCode);
      setTimeout(() => {
        // commonCodeTextの行数分、class="cm-line"を削除
        const commonCodeLines = commonCodeText.split("\n");
        const commonCodeLinesCount = commonCodeLines.length;
        deleteFirstNLines(
          strudelEditorRef.current.editor.editor,
          commonCodeLinesCount + 1
        );
      }, 20);
    }, 0);
  }

  // JSONファイル読み込み
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

  // Monacoエディタの内容変更時
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

  // コード選択時
  function handleSelectCode(id, code) {
    setSelectedCodeId(id);
    setSelectedCode(code);
    strudelEditorRef.current.editor.setCode(code);
  }

  // BPM入力変更
  function handleBpmChange(e) {
    setBpm(e.target.value.replace(/[^0-9]/g, ""));
  }
  // hushBeforeMs入力変更
  function handleHushBeforeMsChange(e) {
    setHushBeforeMs(Number(e.target.value.replace(/[^0-9]/g, "")));
  }

  // DnD: ドラッグ開始
  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  // DnD: DnD行から削除
  function handleRemoveFromRow(rowId) {
    setDndRow(dndRow.filter((b) => b.rowId !== rowId));
    setRepeatCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[rowId];
      return newCounts;
    });
  }

  // DnD行の小節数入力
  function handleRepeatChange(rowId, value) {
    setRepeatCounts((prev) => ({
      ...prev,
      [rowId]: value.replace(/[^0-9]/g, ""),
    }));
  }

  // すべてのコードを一気にDnD行に追加（共通コードは除外）
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

  // コード再生シーケンス（DnD行順）
  async function playSequence() {
    // すべてのtimeoutをクリア
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setIsPlaying(true);
    stopFlag.current = false;
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
      evaluateCommonCode(code, false);

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

  // Play/Stop
  function handlePlay() {
    // 再生中なら必ず停止してから新たに再生
    if (isPlaying) {
      handleStop();
      // handleStopは非同期なので、すぐplaySequenceを呼ぶと競合する可能性がある
      // 少し遅延させてから再生開始
      setTimeout(() => {
        playSequence();
      }, 100);
    } else {
      playSequence();
    }
  }
  function handleStop() {
    stopFlag.current = true;
    setIsPlaying(false);
    playIndexRef.current = 0;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    strudelEditorRef.current.editor.stop();
  }

  // 最初から再生
  function handlePlayFromStart() {
    if (dndRow.length === 0) return;
    if (selectedDnDRowId !== null) {
      playFromStartFlag.current = true;
      setSelectedDnDRowId(null);
    } else {
      handlePlay();
    }
  }

  // DnD row drop handler
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

  // コード一覧 drop handler
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

  // コード一覧からDnD行に追加
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

  // JSONエクスポート
  function handleExportJson() {
    if (Object.keys(jsonData).length === 0) {
      alert("エクスポートするデータがありません");
      return;
    }

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strudel_codes_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 選択されたコードを削除
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

  // コード複製
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

  // 新規作成
  function handleCreateNewCode() {
    const newId = generateId();
    const newCode = "/*\n@title 新規コード\n*/\n";
    const newBlock = { id: newId, code: newCode };
    setCodeList((prev) => [...prev, newBlock]);
    setJsonData((prev) => ({ ...prev, [newId]: { code: newCode } }));
    setSelectedCodeId(newId);
    setSelectedCode(newCode);
  }

  // DnD行の並び順をエクスポート
  function handleExportCodesRowOrder() {
    if (dndRow.length === 0) {
      alert("エクスポートするDnD行がありません");
      return;
    }

    const exportData = {
      codesRow: dndRow.map((block) => ({
        id: block.id,
        repeatCount: repeatCounts[block.rowId] || "",
      })),
      exportDate: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codes_row_order_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // DnD行の並び順をインポート
  function handleImportCodesRowOrder(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);
        if (!importData.codesRow || !Array.isArray(importData.codesRow)) {
          alert("無効なファイル形式です");
          return;
        }

        // インポートしたデータをDnD行に変換（idからcodeを取得）
        const newDndRow = importData.codesRow
          .map((item, index) => {
            // codeListまたはjsonDataからcodeを取得
            let code = "";
            const codeListItem = codeList.find((c) => c.id === item.id);
            if (codeListItem) {
              code = codeListItem.code;
            } else if (jsonData[item.id] && jsonData[item.id].code) {
              code = jsonData[item.id].code;
            } else {
              // codeが見つからない場合はスキップ
              return null;
            }

            return {
              id: item.id,
              code: code,
              rowId: `${item.id}_${Date.now()}_${index}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            };
          })
          .filter(Boolean); // nullを除外

        // repeatCountsも更新
        const newRepeatCounts = {};
        importData.codesRow.forEach((item, index) => {
          if (newDndRow[index]) {
            newRepeatCounts[newDndRow[index].rowId] = item.repeatCount || "";
          }
        });

        setDndRow(newDndRow);
        setRepeatCounts(newRepeatCounts);
        setSelectedDnDRowId(null);
      } catch (err) {
        alert("ファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
  }

  // 全状態のエクスポート
  function handleExportAllState() {
    const exportData = {
      jsonData,
      codeList,
      dndRow,
      repeatCounts,
      commonCodes,
      bpm,
      hushBeforeMs,
      exportDate: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strudeler_all_state_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 全状態のインポート
  function handleImportAllState(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);

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
      } catch (err) {
        alert("ファイルの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
  }

  // 全て削除ボタン用（DnD行の全ブロックのみ削除）
  function handleDeleteAllCodes() {
    setDndRow([]);
    setRepeatCounts({});
    setSelectedDnDRowId(null);
    setCurrentPlayingRowId(null);
  }

  // 現在表示しているコードを再生
  function handlePlayCurrentCode(e) {
    if (!selectedCode || selectedCode.trim() === "") {
      alert("再生するコードがありません");
      return;
    }

    try {
      evaluateCommonCode();
    } catch (e) {
      console.error("コードの実行に失敗しました:", e);
      alert("コードの実行に失敗しました");
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
            sensors={sensors}
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
          sensors={sensors}
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
