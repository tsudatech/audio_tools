import React, { useState, useEffect } from "react";
import { playChord } from "../utils";
import { DndContext } from "@dnd-kit/core";
import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";
import { v4 as uuidv4 } from "uuid";
import cloneDeep from "lodash.clonedeep";

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

const Space = () => <div className="h-16"></div>;
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
const displayChords = (chords) => {
  const ret = [];
  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <Draggable id={chord.id}>
        <div>{chord.chord}</div>
      </Draggable>
    );

    if (i < chords.length - 1) {
      ret.push(
        <Droppable id={chord.id}>
          <div>|</div>
        </Droppable>
      );
    }
  }
  return ret;
};

/**
 * コンポーネント本体
 * @returns
 */
const Equalizer = () => {
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

  return (
    <div className="container pl-16 grid grid-cols-3 h-full flex flex-row">
      <div
        className="container col-span-2 h-full"
        style={{
          backgroundColor: "rgb(24,28,32)",
        }}
      >
        <div className="container">
          <DndContext onDragEnd={() => {}}>
            <div className="flex space-x-4">
              {displayChords(chords[currentRow] || [])}
            </div>
          </DndContext>
        </div>
        <div
          className="btn btn-primary"
          onClick={() => playChord(chords[currentRow] || [])}
        >
          play
        </div>
      </div>
      <div className="container pr-0">
        <Container>
          <div className="w-full mb-2">Scale</div>
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
          <div className="w-full mb-2">Interval</div>
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
          <div className="w-full mb-2">Tension</div>
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
          <div className="w-full mb-2">Fraction</div>
          {scales.map((s) => (
            <input
              className="join-item btn w-32 rounded-none"
              type="radio"
              name="fractions"
              aria-label={s}
              onChange={(e) => setSelectedFraction(s)}
            />
          ))}
        </Container>
        <button
          className="btn btn-primary mt-16 w-full"
          onClick={() => {
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
              chord: `${selectedScale}${intervals[selectedInterval]}${_selectedTensions}${_selectedFraction}`,
            });
            setChords(newChords);
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default Equalizer;
