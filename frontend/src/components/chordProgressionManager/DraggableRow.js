import React from "react";
import { useDraggable } from "@dnd-kit/core";

export function DraggableRow(props) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
    data: {
      type: "row",
    },
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...props.style,
        ...style,
      }}
      {...listeners}
      {...attributes}
      onDoubleClick={props.onDoubleClick}
      className={props.className}
    >
      {props.children}
    </div>
  );
}
