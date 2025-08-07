import React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableDnDBlock from "./SortableDnDBlock";

function DndRowManager({
  codeOrder,
  handleDndRowDragEnd,
  handleDragStart,
  repeatCounts,
  handleRemoveFromRow,
  handleRepeatChange,
  activeId,
  currentPlayingRowId,
  setSelectedDnDRowId,
  selectedDnDRowId,
  jsonData,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
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
          items={codeOrder.map((b) => b.rowId)}
          strategy={horizontalListSortingStrategy}
          tabIndex={0}
        >
          <div className="w-full h-full overflow-y-hidden">
            {codeOrder.map((block, idx) => (
              <div
                key={block.rowId}
                className={idx !== 0 ? "ml-2" : ""}
                style={{ display: "inline-block" }}
              >
                <SortableDnDBlock
                  rowId={block.rowId}
                  id={block.id}
                  jsonData={jsonData}
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
