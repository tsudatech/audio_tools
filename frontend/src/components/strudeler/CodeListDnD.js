import React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import SortableCodeBlock from "./SortableCodeBlock";
import { getCodeListFromJsonData } from "./utils/utils";

function CodeListDnD({
  jsonData,
  handleCodeListDragEnd,
  verticalListSortingStrategy,
  commonCodes,
  handleSelectCode,
  selectedCodeId,
  handleAddBlockToCodeOrder,
  handleCommonCodeChange,
}) {
  const codeList = getCodeListFromJsonData(jsonData);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleCodeListDragEnd}
      tabIndex={0}
    >
      <div
        className="flex flex-col gap-2"
        style={{
          height: "calc(100vh - 328px)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
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
              onAdd={handleAddBlockToCodeOrder}
              isCommonCode={commonCodes[item.id] || false}
              onCommonCodeChange={handleCommonCodeChange}
            />
          ))}

        {/* 共通コードと通常コードの区切り線 */}
        {codeList.some((item) => commonCodes[item.id]) &&
          codeList.some((item) => !commonCodes[item.id]) && (
            <div className="border-t border-gray-600 my-2"></div>
          )}

        <SortableContext
          items={codeList
            .filter((item) => !commonCodes[item.id])
            .map((b) => b.id)}
          strategy={verticalListSortingStrategy}
          tabIndex={0}
        >
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
                onAdd={handleAddBlockToCodeOrder}
                isCommonCode={commonCodes[item.id] || false}
                onCommonCodeChange={handleCommonCodeChange}
              />
            ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}

export default CodeListDnD;
