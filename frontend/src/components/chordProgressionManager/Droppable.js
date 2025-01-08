import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { COLOR_ACCENT } from "../Colors";

export function Droppable(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });
  const style = {
    borderLeft: isOver ? "3px solid white" : "none",
    borderLeftColor: isOver ? COLOR_ACCENT : undefined,
    marginLeft: "0.75rem",
    ...(props.fullWidth ? { width: "100%" } : ""),
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
