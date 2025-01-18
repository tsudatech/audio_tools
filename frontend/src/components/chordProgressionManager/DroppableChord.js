import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { COLOR_ACCENT } from "../Colors";

export function DroppableChord(props) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: {
      accepts: ["chord"],
    },
  });
  const style = {
    borderLeft: isOver ? "3px solid white" : "none",
    borderLeftColor: isOver ? COLOR_ACCENT : "none",
    marginLeft: "0.75rem",
    ...(props.fullWidth ? { width: "100%" } : ""),
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
