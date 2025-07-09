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
    firstShow,
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
                    container bg-base-200 bg-opacity-80 hover:bg-neutral-content: hover:bg-opacity-50 h-52
                    rounded-lg overflow-visible pl-8 items-start flex-none`}
        style={{
          borderColor: currentRow == id ? COLOR_ACCENT : "none",
          borderWidth: currentRow == id ? 3 : 0,
          width: "initial",
          minWidth: "100%",
          maxWidth: "initial",
          position: "relative",
        }}
      >
        {firstShow && <div className="absolute bg-base-300 bg-opacity-90 w-full h-full left-0 flex items-center justify-center z-50">
          <p className="text-2xl">Double-click or press the spacebar to play!</p>
        </div>}
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
