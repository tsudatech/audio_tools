import React from "react";

function TopControlBar({
  jsonFileInputRef,
  handleJsonFileChange,
  hushBeforeMs,
  handleHushBeforeMsChange,
  bpm,
  handleBpmChange,
  handlePlayFromStart,
  dndRow,
  handlePlay,
  handleStop,
  isPlaying,
  handleExportCodesRowOrder,
  importCodesRowInputRef,
  handleImportCodesRowOrder,
  handleExportAllState,
  importAllStateInputRef,
  handleImportAllState,
  handleDeleteAllCodes,
}) {
  return (
    <div className="w-full flex flex-row items-center mb-2 gap-4">
      <label className="mr-1 text-sm">hush(ms)</label>
      <input
        type="number"
        value={hushBeforeMs}
        onChange={handleHushBeforeMsChange}
        className="w-16 px-2 py-1 border rounded text-sm mr-2 bg-[#0b253a] text-[#d6deeb] border-[#394b59]"
        disabled={isPlaying}
      />
      <label className="mr-1 text-sm">BPM</label>
      <input
        type="number"
        value={bpm}
        onChange={handleBpmChange}
        className="w-16 px-2 py-1 border rounded text-sm mr-2 bg-[#0b253a] text-[#d6deeb] border-[#394b59]"
        disabled={isPlaying}
      />
      <button
        className="btn bg-blue-500 btn-sm hover:bg-blue-400 text-white px-4 py-1 rounded text-sm"
        onClick={handlePlayFromStart}
        disabled={dndRow.length === 0}
      >
        最初から再生
      </button>
      <button
        className="btn bg-blue-500 btn-sm hover:bg-blue-400 text-white px-4 py-1 rounded text-sm"
        onClick={handlePlay}
      >
        Play
      </button>
      <button
        className="btn bg-gray-500 btn-sm hover:bg-gray-400 text-white px-4 py-1 rounded text-sm"
        onClick={handleStop}
        disabled={!isPlaying}
      >
        Stop
      </button>
      <button
        className="btn bg-green-500 btn-sm hover:bg-green-400 text-white px-3 py-1 rounded text-sm"
        onClick={handleExportCodesRowOrder}
        disabled={dndRow.length === 0}
      >
        エクスポート
      </button>
      <input
        ref={importCodesRowInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportCodesRowOrder}
        className="hidden"
      />
      <button
        className="btn bg-green-500 btn-sm hover:bg-green-400 text-white px-3 py-1 rounded text-sm"
        onClick={() => importCodesRowInputRef.current?.click()}
      >
        インポート
      </button>
      <button
        className="btn bg-red-500 btn-sm hover:bg-red-400 text-white px-3 py-1 rounded text-sm"
        onClick={handleDeleteAllCodes}
      >
        全て削除
      </button>
      <div className="ml-auto flex gap-2">
        <button
          className="btn bg-purple-500 btn-sm hover:bg-purple-400 text-white px-3 py-1 rounded text-sm"
          onClick={handleExportAllState}
        >
          全状態エクスポート
        </button>
        <input
          ref={importAllStateInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportAllState}
          className="hidden"
        />
        <button
          className="btn bg-purple-500 btn-sm hover:bg-purple-400 text-white px-3 py-1 rounded text-sm"
          onClick={() => importAllStateInputRef.current?.click()}
        >
          全状態インポート
        </button>
      </div>
    </div>
  );
}

export default TopControlBar;
