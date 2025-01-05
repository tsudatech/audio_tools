import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { COLOR_ACCENT } from "../Colors";

export function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });
  const style = {
    borderRight: isOver ? "3px solid white" : "none",
    borderRightColor: isOver ? COLOR_ACCENT : undefined,
    marginRight: "0.375rem",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
