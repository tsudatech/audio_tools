import React, { useState } from "react";
import { DraggableRow } from "./DraggableRow";
import { DroppableRow } from "./DroppableRow";
import { COLOR_ACCENT } from "../Colors";
import ChordRowContent from "./ChordRowContent";

/**
 * コンポーネント本体
 * @returns
 */
const ChordRow = (props) => {
  const {
    id,
    currentRow,
    setCurrentRow,
    rowName,
    setRowName,
    chord,
    playChord,
    playingChord,
    stopPlay,
    downloadMidi,
    deleteRow,
    duplicateRow,
    deleteChord,
  } = props;

  return (
    <>
      <DraggableRow
        id={id}
        onClick={() => {
          stopPlay();
          setCurrentRow(id);
        }}
        onDoubleClick={() => playChord(chord || [])}
        className={`
                    container bg-neutral hover:bg-neutral-content: hover:bg-opacity-70 h-52
                    rounded-lg overflow-visible pl-8 items-start flex-none`}
        style={{
          borderColor: currentRow == id ? COLOR_ACCENT : "none",
          borderWidth: currentRow == id ? 3 : 0,
          width: "initial",
          minWidth: "100%",
          maxWidth: "initial",
        }}
      >
        <ChordRowContent
          {...{
            id,
            rowName,
            setRowName,
            playChord,
            downloadMidi,
            chord,
            deleteRow,
            duplicateRow,
            deleteChord,
            playingChord,
            stopPlay,
          }}
        />
      </DraggableRow>
      <DroppableRow id={id} />
    </>
  );
};

export default ChordRow;
