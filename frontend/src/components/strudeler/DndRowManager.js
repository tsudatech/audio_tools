import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableDnDBlock from "./SortableDnDBlock";

function DndRowManager({
  dndRow,
  sensors,
  handleDndRowDragEnd,
  handleDragStart,
  repeatCounts,
  handleRemoveFromRow,
  handleRepeatChange,
  activeId,
  currentPlayingRowId,
  setSelectedDnDRowId,
  selectedDnDRowId,
}) {
  return (
    <div
      className="flex flex-row items-end gap-0 min-h-[72px] w-full overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
      style={{ WebkitOverflowScrolling: "touch" }}
      onDragOver={(e) => e.preventDefault()}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDndRowDragEnd}
        onDragStart={handleDragStart}
        tabIndex={0}
      >
        <SortableContext
          items={dndRow.map((b) => b.rowId)}
          strategy={horizontalListSortingStrategy}
          tabIndex={0}
        >
          <div className="w-full h-full overflow-y-hidden">
            {dndRow.map((block, idx) => (
              <div
                key={block.rowId}
                className={idx !== 0 ? "ml-2" : ""}
                style={{ display: "inline-block" }}
              >
                <SortableDnDBlock
                  rowId={block.rowId}
                  code={block.code}
                  repeatCount={repeatCounts[block.rowId]}
                  onRemove={handleRemoveFromRow}
                  onRepeatChange={handleRepeatChange}
                  isActive={activeId === block.rowId}
                  isPlaying={currentPlayingRowId === block.rowId}
                  tabIndex={0}
                  onSelect={() => setSelectedDnDRowId(block.rowId)}
                  selected={selectedDnDRowId === block.rowId}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default DndRowManager;
