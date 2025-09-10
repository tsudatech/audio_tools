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
  repeatCounts,
}) {
  // 総再生時間を計算する関数
  const calculateTotalPlaybackTime = () => {
    if (codeOrder.length === 0) return 0;

    let bpmVal = parseInt(bpm, 10);
    if (isNaN(bpmVal) || bpmVal <= 0) bpmVal = 120;

    let totalTime = 0;

    codeOrder.forEach(({ codeOrderId }) => {
      let repeat = parseInt(repeatCounts[codeOrderId], 10);
      if (isNaN(repeat) || repeat <= 0) repeat = 8;

      // 1小節の長さ(秒) = 60 / BPM * 4 (4拍子)
      const barSec = (60 / bpmVal) * 4;
      const blockTime = barSec * repeat;
      totalTime += blockTime;
    });

    return totalTime;
  };

  // 時間をフォーマットする関数
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
    } else {
      return `${remainingSeconds}.${milliseconds.toString().padStart(3, "0")}s`;
    }
  };

  const totalPlaybackTime = calculateTotalPlaybackTime();

  return (
    <div
      className="w-full flex flex-row items-center mb-3 gap-4 overflow-x-auto scrollbar-hide"
      style={{ whiteSpace: "nowrap" }}
    >
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
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">総再生時間:</label>
        <span className="text-sm bg-[#0b253a] text-[#d6deeb] px-2 py-1 rounded border border-[#394b59] min-w-[80px] text-center">
          {formatTime(totalPlaybackTime)}
        </span>
      </div>
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
