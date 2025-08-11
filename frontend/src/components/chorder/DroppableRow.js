import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { COLOR_ACCENT } from "../Colors";

export function DroppableRow(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: {
      accepts: ["row"],
    },
  });
  const style = {
    borderTop: isOver ? "3px solid white" : "none",
    borderTopColor: isOver ? COLOR_ACCENT : "none",
    boxSizing: "content-box",
    width: "100%",
  };

  return (
    <div className="w-full" ref={setNodeRef}>
      <div class="h-4 mt-4" style={style}></div>
    </div>
  );
}
