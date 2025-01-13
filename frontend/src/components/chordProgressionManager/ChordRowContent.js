import React from "react";
import { DraggableChord } from "./DraggableChord";
import { DroppableChord } from "./DroppableChord";
import * as Tone from "tone";
import Modal from "../common/Modal";

/**
 * コードを表示する
 * @param {*} chords
 * @returns
 */
const displayChords = (rowId, chords, deleteChord, playingChord) => {
  const ret = [
    <DroppableChord id={rowId + "_first"} fullWidth={chords.length == 0}>
      <div className="h-28 w-2.5"></div>
    </DroppableChord>,
  ];

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <DraggableChord id={rowId + "_" + chord.id}>
        <div
          className={`h-28 w-28 bg-base-300 bg-opacity-60 rounded-lg
            flex items-center justify-center relative group 
            ${playingChord == chord.id ? "bg-neutral border-2" : ""}`}
        >
          <p
            className="text-xl h-full w-full flex flex-col items-center justify-center"
            style={{ wordBreak: "break-word" }}
          >
            <span className="mt-3">{chord.label}</span>
            <span className="text-xs">{"(" + chord.octave + ")"}</span>
          </p>

          {/* 消去ボタン */}
          <div
            className={`btn btn-square btn-outline absolute h-5 w-5
              top-2 right-2 hidden group-hover:flex rounded-md`}
            style={{ minHeight: "initial" }}
            onClick={() => deleteChord(rowId, chord.id)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
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
  const {
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
  } = props;

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
          <OptionButton
            onClick={(e) => {
              playChord(chord);
              e.stopPropagation();
            }}
          >
            Play
          </OptionButton>
          <OptionButton onClick={() => stopPlay()}>Stop</OptionButton>
          <OptionButton onClick={() => downloadMidi(chord)}>
            Download MIDI
          </OptionButton>
          <OptionButton onClick={() => duplicateRow(id)}>
            Duplicate
          </OptionButton>
          <OptionButton
            onClick={() =>
              document.getElementById("delete_row_dialog_" + id).showModal()
            }
          >
            Delete
          </OptionButton>
        </div>
      </div>
      <div className="flex w-full mt-5">
        {displayChords(id, chord || [], deleteChord, playingChord)}
      </div>

      {/* 行削除するかどうかの確認ダイアログ */}
      <Modal
        id={"delete_row_dialog_" + id}
        text="Are you sure you want to delete this chord progression?"
        onOk={() => deleteRow(id)}
      />
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
