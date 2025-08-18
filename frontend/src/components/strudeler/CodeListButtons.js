import React from "react";

function CodeListButtons({
  jsonFileInputRef,
  handleJsonFileChange,
  handleAddAllToRow,
  handleExportJson,
  jsonData,
  handleDeleteSelectedCode,
  selectedCodeId,
  handleDuplicateSelectedCode,
  handleCreateNewCode,
  handlePlayCurrentCode,
  handleStop,
}) {
  const selectedCode = selectedCodeId
    ? jsonData[selectedCodeId]?.code || ""
    : "";
  return (
    <div className="flex flex-row items-center mb-4 gap-2">
      <input
        ref={jsonFileInputRef}
        type="file"
        accept="application/json"
        onChange={handleJsonFileChange}
        className="hidden"
      />
      <button
        className="btn btn-sm btn-primary normal-case"
        onClick={handlePlayCurrentCode}
        disabled={!selectedCode || selectedCode.trim() === ""}
      >
        再生
      </button>
      <button
        className="btn btn-sm btn-outline btn-error normal-case"
        onClick={handleStop}
      >
        停止
      </button>
      <button
        className="btn btn-sm btn-success normal-case"
        onClick={handleExportJson}
        disabled={Object.keys(jsonData).length === 0}
      >
        エクスポート
      </button>
      <button
        className="btn btn-sm btn-success normal-case"
        onClick={() => jsonFileInputRef.current?.click()}
      >
        インポート
      </button>
      <button
        className="btn btn-sm btn-outline normal-case"
        onClick={handleCreateNewCode}
      >
        新規作成
      </button>
      <button
        className="btn btn-sm btn-outline normal-case"
        onClick={handleDuplicateSelectedCode}
        disabled={!selectedCodeId}
      >
        複製
      </button>
      <button
        className="btn btn-sm btn-outline btn-error normal-case"
        onClick={handleDeleteSelectedCode}
        disabled={!selectedCodeId}
      >
        削除
      </button>
      <button
        className="btn btn-sm btn-outline normal-case"
        onClick={handleAddAllToRow}
        disabled={Object.keys(jsonData).length === 0}
      >
        すべて追加
      </button>
    </div>
  );
}

export default CodeListButtons;
