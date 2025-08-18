import React from "react";

function TopControlBar({
  jsonFileInputRef,
  handleJsonFileChange,
  hushBeforeMs,
  handleHushBeforeMsChange,
  bpm,
  handleBpmChange,
  handlePlayFromStart,
  codeOrder,
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
    <div className="w-full flex flex-row items-center mb-3 gap-4">
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
        className="btn btn-sm btn-primary normal-case"
        onClick={handlePlayFromStart}
        disabled={codeOrder.length === 0}
      >
        最初から再生
      </button>
      <button
        className="btn btn-sm btn-primary normal-case"
        onClick={handlePlay}
      >
        再生
      </button>
      <button
        className="btn btn-sm btn-outline btn-error normal-case"
        onClick={handleStop}
        disabled={!isPlaying}
      >
        停止
      </button>
      <button
        className="btn btn-sm btn-success normal-case"
        onClick={handleExportCodesRowOrder}
        disabled={codeOrder.length === 0}
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
        className="btn btn-sm btn-success normal-case"
        onClick={() => importCodesRowInputRef.current?.click()}
      >
        インポート
      </button>
      <button
        className="btn btn-sm btn-outline btn-error normal-case"
        onClick={handleDeleteAllCodes}
      >
        全て削除
      </button>
      <div className="ml-auto" />
      <button
        className="btn btn-sm btn-success normal-case"
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
        className="btn btn-sm btn-success normal-case"
        onClick={() => importAllStateInputRef.current?.click()}
      >
        全状態インポート
      </button>
    </div>
  );
}

export default TopControlBar;
