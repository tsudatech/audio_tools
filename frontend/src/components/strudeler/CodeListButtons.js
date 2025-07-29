import React from "react";

function CodeListButtons({
  jsonFileInputRef,
  handleJsonFileChange,
  handleAddAllToRow,
  codeList,
  handleExportJson,
  jsonData,
  handleDeleteSelectedCode,
  selectedCodeId,
  handleDuplicateSelectedCode,
  handleCreateNewCode,
  handlePlayCurrentCode,
  selectedCode,
  handleStop,
}) {
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
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-400 text-sm"
        onClick={() => jsonFileInputRef.current?.click()}
      >
        JSON読み込み
      </button>
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-400 text-sm"
        onClick={handleAddAllToRow}
        disabled={codeList.length === 0}
      >
        すべて追加
      </button>
      <button
        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-400 text-sm"
        onClick={handleExportJson}
        disabled={Object.keys(jsonData).length === 0}
      >
        エクスポート
      </button>
      <button
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-400 text-sm"
        onClick={handleDeleteSelectedCode}
        disabled={!selectedCodeId}
      >
        削除
      </button>
      <button
        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-400 text-sm"
        onClick={handleDuplicateSelectedCode}
        disabled={!selectedCodeId}
      >
        複製
      </button>
      <button
        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-400 text-sm"
        onClick={handleCreateNewCode}
      >
        新規作成
      </button>
      <button
        className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-400 text-sm"
        onClick={handlePlayCurrentCode}
        disabled={!selectedCode || selectedCode.trim() === ""}
      >
        再生
      </button>
      <button
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-400 text-sm"
        onClick={handleStop}
      >
        停止
      </button>
    </div>
  );
}

export default CodeListButtons;
