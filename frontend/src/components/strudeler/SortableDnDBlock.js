import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableDnDBlock({
  rowId,
  code,
  repeatCount,
  onRemove,
  onRepeatChange,
  isActive,
  isPlaying,
  onSelect,
  selected,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });
  let bg = "#011627"; // Night Owl base
  if (isPlaying && selected) bg = "#283e56"; // Both: deep blue
  else if (isPlaying) bg = "#3b5b7c"; // Playing: darker blue
  else if (selected) bg = "#1d3b53"; // Selected: Night Owl highlight
  else if (isActive) bg = "#394b59"; // Drag active: subtle blue
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: bg,
    cursor: "pointer",
    color: "#d6deeb",
    border: isActive ? "2px solid #7e57c2" : "1px solid #1e293b",
  };
  function extractTitle(code, fallback) {
    const match = code.match(/@title\s+(.+)/);
    return match ? match[1].trim() : fallback;
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 rounded flex items-center gap-2"
      tabIndex={0}
      onMouseDown={() => onSelect(code)}
    >
      <div className="font-bold text-base text-blue-300 mr-2">
        {extractTitle(code, rowId)}
      </div>
      <input
        type="number"
        value={repeatCount || ""}
        onChange={(e) => onRepeatChange(rowId, e.target.value)}
        className="w-12 px-1 py-0.5 border rounded text-xs bg-[#0b253a] text-[#d6deeb] border-[#394b59]"
        placeholder="小節"
        disabled={isPlaying}
      />
      <span className="text-xs ml-1">小節</span>
      <button
        className="ml-2 text-xs text-red-400"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(rowId);
        }}
        disabled={isPlaying}
        tabIndex={0}
      >
        削除
      </button>
    </div>
  );
}

export default SortableDnDBlock;
