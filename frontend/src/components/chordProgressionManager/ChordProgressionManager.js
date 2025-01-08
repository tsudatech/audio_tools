import React, { useState, useEffect } from "react";
import { playChord } from "../utils";
import { DndContext } from "@dnd-kit/core";
import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash.clonedeep";
import { COLOR_ACCENT } from "../Colors";
import * as Tone from "tone";

const scales = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const intervals = {
  M: "maj",
  m: "m",
  dim: "dim",
  aug: "aug",
  7: "7",
  M7: "maj7",
  m7: "m7",
};

const tensions = ["b9", "9", "#9", "b11", "11", "b13", "13"];

const Space = () => <div className="h-14"></div>;
const Container = (props) => (
  <div className="join col-span-1 block max-w-64 2xl:max-w-sm flex flex-wrap justify-center lg:justify-start">
    {props.children}
  </div>
);

/**
 * コードを表示する
 * @param {*} chords
 * @returns
 */
const displayChords = (rowId, chords) => {
  const ret = [];

  ret.push(
    <Droppable id={rowId + "_first"} fullWidth={chords.length == 0}>
      <div className="h-32 w-2.5"></div>
    </Droppable>
  );

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <Draggable id={rowId + "_" + chord.id}>
        <div className="h-32 w-32 bg-base-300 bg-opacity-60 rounded-lg flex items-center justify-center ">
          <p
            className="text-xl h-full w-full flex items-center justify-center"
            style={{ wordBreak: "break-word" }}
          >
            {chord.label}
          </p>
        </div>
      </Draggable>
    );

    ret.push(
      <Droppable id={rowId + "_" + chord.id} fullWidth={i == chords.length - 1}>
        <div className="h-32 w-2.5"></div>
      </Droppable>
    );
  }
  return ret;
};

/**
 * コンポーネント本体
 * @returns
 */
const ChordProgressionManager = () => {
  const [chords, setChords] = useState({});
  const [currentRow, setCurrentRow] = useState("");
  const [selectedScale, setSelectedScale] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("");
  const [selectedTensions, setSelectedTensions] = useState([]);
  const [selectedFraction, setSelectedFraction] = useState("");

  useEffect(() => {
    const id = uuidv4();
    setChords({ [id]: [] });
    setCurrentRow(id);
  }, []);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id == over.id) {
      return;
    }

    const newChords = cloneDeep(chords);

    // draggableを取得
    const overRowId = over.id.split("_")[0];
    const overChordId = over.id.split("_")[1];
    const activeRowId = active.id.split("_")[0];
    const activeChordId = active.id.split("_")[1];
    const activeChord = chords[activeRowId].filter(
      (c) => c.id == activeChordId
    )[0];
    activeChord.rowId = overRowId;

    // draggable以外を抽出
    newChords[activeRowId] = newChords[activeRowId].filter(
      (c) => c.id != activeChordId
    );

    // droppableの次に挿入
    const overIndex = newChords[overRowId].findIndex(
      (c) => c.id == overChordId
    );
    newChords[overRowId].splice(overIndex + 1, 0, activeChord);

    setChords(newChords);
  }

  return (
    <div
      className="container pl-16 grid grid-cols-3 h-full flex flex-row items-start"
      style={{ maxWidth: "2000px" }}
    >
      <div
        id="row-wrapper"
        className={`
          container bg-base-300 bg-opacity-50 justify-start
          p-8 col-span-2 h-full max-h-full rounded-lg overflow-y-scroll`}
        style={{ height: "1104px" }}
      >
        <div
          className="btn btn-primary w-full mb-8"
          onClick={() => {
            const newChords = cloneDeep(chords);
            setChords(Object.assign({}, { [uuidv4()]: [] }, newChords));
          }}
        >
          Add Row
        </div>
        <DndContext onDragEnd={handleDragEnd}>
          {Object.entries(chords).map(([id, chord]) => {
            return (
              <div
                onClick={() => {
                  Tone.getTransport().stop();
                  setCurrentRow(id);
                }}
                onDoubleClick={() => playChord(chord || [])}
                className={`
                  container bg-neutral hover:bg-neutral-content: hover:bg-opacity-70 h-40
                  rounded-lg overflow-visible pl-8 items-start mb-8 flex-none`}
                style={{
                  borderColor: currentRow == id ? COLOR_ACCENT : "none",
                  borderWidth: currentRow == id ? 3 : 0,
                  width: "initial",
                  minWidth: "100%",
                  maxWidth: "initial",
                }}
              >
                <div className="flex w-full">
                  {displayChords(id, chord || [])}
                </div>
              </div>
            );
          })}
        </DndContext>
      </div>
      <div className="container pr-0">
        <button
          className="btn btn-primary mt-8 mb-8 w-full"
          onClick={() => {
            if (!selectedScale || !selectedInterval) {
              return;
            }

            const newChords = cloneDeep(chords);
            let _selectedTensions = selectedTensions.join("add");
            if (_selectedTensions) {
              _selectedTensions = "add" + _selectedTensions;
            }

            let _selectedFraction = selectedFraction;
            if (_selectedFraction) {
              _selectedFraction = "/" + _selectedFraction;
            }

            newChords[currentRow].push({
              id: uuidv4(),
              rowId: currentRow,
              label: `${selectedScale}${selectedInterval}${_selectedTensions}${_selectedFraction}`,
              chord: `${selectedScale}${
                selectedInterval ? intervals[selectedInterval] : ""
              }${_selectedTensions}${_selectedFraction}`,
            });

            setChords(newChords);
          }}
        >
          Add Chord
        </button>
        <Container>
          <div className="w-full mb-2 text-lg font-bold">Scale</div>
          {scales.map((s) => (
            <input
              className="join-item btn w-32 rounded-none"
              type="radio"
              name="scales"
              aria-label={s}
              onChange={(e) => setSelectedScale(s)}
            />
          ))}
        </Container>
        <Space />
        <Container>
          <div className="w-full mb-2 text-lg font-bold">Interval</div>
          {Object.keys(intervals).map((s) => (
            <input
              className="join-item btn w-32 rounded-none"
              type="radio"
              name="intervals"
              aria-label={s}
              onChange={(e) => setSelectedInterval(s)}
            />
          ))}
        </Container>
        <Space />
        <Container>
          <div className="w-full mb-2 text-lg font-bold">Tension</div>
          {tensions.map((s) => (
            <div
              className={`join-item btn ${
                selectedTensions.includes(s) ? "btn-primary" : ""
              } w-32 rounded-none`}
              onClick={() => {
                if (selectedTensions.includes(s)) {
                  setSelectedTensions(
                    [...selectedTensions].filter((t) => t != s)
                  );
                } else {
                  setSelectedTensions([...selectedTensions, s]);
                }
              }}
            >
              {s}
            </div>
          ))}
        </Container>
        <Space />
        <Container>
          <div className="w-full mb-2 text-lg font-bold">Fraction</div>
          {scales.map((s) => (
            <input
              className="join-item btn w-32 rounded-none"
              type="radio"
              name="fractions"
              aria-label={s}
              checked={s == selectedFraction}
              onClick={() =>
                setSelectedFraction(s == selectedFraction ? "" : s)
              }
            />
          ))}
        </Container>
      </div>
    </div>
  );
};

export default ChordProgressionManager;
