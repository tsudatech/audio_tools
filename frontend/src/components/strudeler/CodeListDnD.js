import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import SortableCodeBlock from "./SortableCodeBlock";

function CodeListDnD({
  codeList,
  sensors,
  handleCodeListDragEnd,
  verticalListSortingStrategy,
  commonCodes,
  handleSelectCode,
  selectedCodeId,
  handleAddBlockToDnDRow,
  handleCommonCodeChange,
}) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleCodeListDragEnd}
      tabIndex={0}
    >
      <SortableContext
        items={codeList.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
        tabIndex={0}
      >
        <div
          className="flex flex-col gap-2"
          style={{ height: "calc(100vh - 328px)", overflowY: "auto" }}
        >
          {/* 共通コード（固定表示） */}
          {codeList
            .filter((item) => commonCodes[item.id])
            .map((item) => (
              <SortableCodeBlock
                key={item.id}
                id={item.id}
                code={item.code}
                onSelect={() => handleSelectCode(item.id, item.code)}
                selected={selectedCodeId === item.id}
                onAdd={handleAddBlockToDnDRow}
                isCommonCode={commonCodes[item.id] || false}
                onCommonCodeChange={handleCommonCodeChange}
              />
            ))}

          {/* 共通コードと通常コードの区切り線 */}
          {codeList.some((item) => commonCodes[item.id]) &&
            codeList.some((item) => !commonCodes[item.id]) && (
              <div className="border-t border-gray-600 my-2"></div>
            )}

          {/* 通常コード */}
          {codeList
            .filter((item) => !commonCodes[item.id])
            .map((item) => (
              <SortableCodeBlock
                key={item.id}
                id={item.id}
                code={item.code}
                onSelect={() => handleSelectCode(item.id, item.code)}
                selected={selectedCodeId === item.id}
                onAdd={handleAddBlockToDnDRow}
                isCommonCode={commonCodes[item.id] || false}
                onCommonCodeChange={handleCommonCodeChange}
              />
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default CodeListDnD;
