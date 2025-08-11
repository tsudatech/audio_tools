import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function extractTitle(code, fallback) {
  const match = code.match(/@title\s+(.+)/);
  return match ? match[1].trim() : fallback;
}

function SortableCodeBlock({
  id,
  code,
  onSelect,
  selected,
  onAdd,
  isCommonCode,
  onCommonCodeChange,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({ id });
  let bg = "#011627"; // Night Owl base
  if (selected) bg = "#1d3b53"; // Night Owl highlight
  const style = {
    background: bg,
    color: "#d6deeb",
    cursor: "pointer",
    border: "1px solid #1e293b",
    opacity: isDragging ? 0.5 : 1,
    transition,
    transform: CSS.Transform.toString(transform),
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="p-4 rounded mb-2 flex items-center justify-between gap-2"
      style={style}
      onClick={() => onSelect(code)}
      data-code-id={id}
    >
      <div className="flex items-center gap-2 flex-1">
        <div>
          <div className="font-bold text-base mb-1 text-blue-300">
            {extractTitle(code, id)}
          </div>
          <div className="font-mono text-xs text-gray-400 mb-2">ID: {id}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isCommonCode || false}
          onChange={(e) => {
            e.stopPropagation();
            onCommonCodeChange(id, e.target.checked);
          }}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          title="共通コード"
        />
        <button
          className="text-xs p-0.5 rounded bg-transparent hover:bg-gray-700/30 text-gray-300"
          style={{
            width: 24,
            height: 24,
            minWidth: 0,
            minHeight: 0,
            lineHeight: 1,
            fontSize: 12,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAdd(id);
          }}
          tabIndex={0}
          title="上部に追加"
        >
          ＋
        </button>
      </div>
    </div>
  );
}

export default SortableCodeBlock;
