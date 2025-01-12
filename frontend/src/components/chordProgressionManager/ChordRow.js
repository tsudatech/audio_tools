import React from "react";
import { playChord as _playChord, downloadMidiFile } from "./utils";
import { DraggableRow } from "./DraggableRow";
import { DroppableRow } from "./DroppableRow";
import { COLOR_ACCENT } from "../Colors";
import * as Tone from "tone";
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
    setError,
    tempo,
  } = props;

  // バリデーション
  const validation = () => {
    if (!tempo || tempo == 0 || tempo > 300) {
      setError("Tempo must be greater than 0 or less than 301.");
      return false;
    }

    return true;
  };

  // コードを演奏
  const playChord = (chord) => {
    if (!validation()) {
      return;
    }

    if (!chord || chord.length == 0) {
      setError("At least one chord has to be added to play.");
      return;
    }
    _playChord(chord || [], tempo);
  };

  // コードを演奏
  const downloadMidi = (chord) => {
    if (!validation()) {
      return;
    }

    if (!chord || chord.length == 0) {
      setError("At least one chord has to be added to download.");
      return;
    }
    downloadMidiFile(chord, tempo);
  };

  return (
    <>
      <DraggableRow
        id={id}
        onClick={() => {
          Tone.getTransport().stop();
          setCurrentRow(id);
        }}
        onDoubleClick={() => playChord(chord || [], tempo)}
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
          }}
        />
      </DraggableRow>
      <DroppableRow id={id} />
    </>
  );
};

export default ChordRow;
