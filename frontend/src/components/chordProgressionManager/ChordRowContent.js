import React from "react";
import { DraggableChord } from "./DraggableChord";
import { DroppableChord } from "./DroppableChord";
import * as Tone from "tone";

/**
 * コードを表示する
 * @param {*} chords
 * @returns
 */
const displayChords = (rowId, chords) => {
  const ret = [];

  ret.push(
    <DroppableChord id={rowId + "_first"} fullWidth={chords.length == 0}>
      <div className="h-28 w-2.5"></div>
    </DroppableChord>
  );

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <DraggableChord id={rowId + "_" + chord.id}>
        <div className="h-28 w-28 bg-base-300 bg-opacity-60 rounded-lg flex items-center justify-center ">
          <p
            className="text-xl h-full w-full flex flex-col items-center justify-center"
            style={{ wordBreak: "break-word" }}
          >
            <span className="mt-3">{chord.label}</span>
            <span className="text-xs">{"(" + chord.octave + ")"}</span>
          </p>
        </div>
      </DraggableChord>
    );

    ret.push(
      <DroppableChord
        id={rowId + "_" + chord.id}
        fullWidth={i == chords.length - 1}
      >
        <div className="h-28 w-2.5"></div>
      </DroppableChord>
    );
  }
  return ret;
};

/**
 * コンポーネント本体
 * @returns
 */
const ChordRowContent = (props) => {
  const { id, rowName, setRowName, playChord, downloadMidi, chord } = props;
  return (
    <>
      <div
        className="flex w-full overflow-visible"
        style={{ minWidth: "752px" }}
      >
        <div className="flex items-center">
          <p>Name: </p>
          <input
            type="text"
            value={rowName[id] || ""}
            className="input bg-base-100 bg-opacity-60 w-full max-w-xs h-8 ml-2"
            onChange={(event) => {
              const newRowName = { ...rowName };
              const value = event.target.value;
              newRowName[id] = value;
              setRowName(newRowName);
            }}
          />
        </div>
        <div className="ml-2">
          <OptionButton onClick={() => playChord(chord)}>Play</OptionButton>
          <OptionButton onClick={() => Tone.getTransport().stop()}>
            Stop
          </OptionButton>
          <OptionButton onClick={() => downloadMidi(chord)}>
            Download MIDI
          </OptionButton>
          <OptionButton onClick={() => {}}>Duplicate</OptionButton>
          <OptionButton onClick={() => {}}>Delete</OptionButton>
        </div>
      </div>
      <div className="flex w-full mt-5">{displayChords(id, chord || [])}</div>
    </>
  );
};

const OptionButton = (props) => (
  <div
    className="btn btn-neutral h-8 ml-2"
    style={{ minHeight: "initial" }}
    onClick={props.onClick}
  >
    {props.children}
  </div>
);

export default ChordRowContent;
