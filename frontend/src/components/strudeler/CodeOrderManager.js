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

function CodeOrderManager({
  codeOrder,
  handleCodeOrderDragEnd,
  handleDragStart,
  repeatCounts,
  handleRemoveFromRow,
  handleRepeatChange,
  activeId,
  currentPlayingCodeOrderId,
  setSelectedCodeOrderId,
  selectedCodeOrderId,
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
        onDragEnd={handleCodeOrderDragEnd}
        onDragStart={handleDragStart}
        tabIndex={0}
      >
        <SortableContext
          items={codeOrder.map((b) => b.codeOrderId)}
          strategy={horizontalListSortingStrategy}
          tabIndex={0}
        >
          <div className="w-full h-full overflow-y-hidden">
            {codeOrder.map((block, idx) => (
              <div
                key={block.codeOrderId}
                className={idx !== 0 ? "ml-2" : ""}
                style={{ display: "inline-block" }}
              >
                <SortableDnDBlock
                  codeOrderId={block.codeOrderId}
                  id={block.id}
                  jsonData={jsonData}
                  repeatCount={repeatCounts[block.codeOrderId]}
                  onRemove={handleRemoveFromRow}
                  onRepeatChange={handleRepeatChange}
                  isActive={activeId === block.codeOrderId}
                  isPlaying={currentPlayingCodeOrderId === block.codeOrderId}
                  tabIndex={0}
                  onSelect={() => setSelectedCodeOrderId(block.codeOrderId)}
                  selected={selectedCodeOrderId === block.codeOrderId}
                />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default CodeOrderManager;
