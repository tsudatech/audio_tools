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

  if (chords.length > 1) {
    ret.push(
      <Droppable id={chords[0].id + "-first"}>
        <div className="h-32 w-1.5"></div>
      </Droppable>
    );
  }

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <Draggable id={chord.id}>
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

    if (chords.length > 1) {
      ret.push(
        <Droppable id={chord.id}>
          <div className="h-32 w-1.5"></div>
        </Droppable>
      );
    }
  }
  return ret;
};

/**
 * 要素探索
 * @param {*} data
 * @param {*} targetId
 * @returns
 */
const findElementById = (data, targetId) => {
  for (const elements of Object.values(data)) {
    const found = elements.find((elm) => elm.id === targetId);
    if (found) {
      return found; // 一致した要素を返す
    }
  }
  return null; // 一致する要素がない場合
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
    const overChord = findElementById(chords, over.id.replace("-first", ""));
    const overRowId = overChord.rowId;
    const activeChord = findElementById(chords, active.id);
    const activeRowId = activeChord.rowId;
    activeChord.rowId = overRowId;

    // draggable以外を抽出
    newChords[activeRowId] = newChords[activeRowId].filter(
      (c) => c.id != active.id
    );

    // droppableの次に挿入
    const overIndex = newChords[overRowId].findIndex((c) => c.id == over.id);
    newChords[overRowId].splice(overIndex + 1, 0, activeChord);

    setChords(newChords);
  }

  return (
    <div
      className="container pl-16 grid grid-cols-3 h-full flex flex-row items-start"
      style={{ maxWidth: "2000px" }}
    >
      <div
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
                id={currentRow}
                onClick={() => {
                  Tone.getTransport().stop();
                  setCurrentRow(id);
                }}
                onDoubleClick={() => playChord(chord || [])}
                className={`
                container bg-neutral hover:bg-neutral-content: hover:bg-opacity-70 w-full h-44 
                rounded-lg overflow-x-scroll overflow-y-hidden pt-4 pl-8 items-start mb-8 flex-none`}
                style={{
                  borderColor: currentRow == id ? COLOR_ACCENT : "none",
                  borderWidth: currentRow == id ? 3 : 0,
                }}
              >
                <div className="flex space-x-4">
                  {displayChords(chord || [])}
                </div>
              </div>
            );
          })}
        </DndContext>
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
              checked={s == selectedFraction}
              onClick={() =>
                setSelectedFraction(s == selectedFraction ? "" : s)
              }
            />
          ))}
        </Container>
        <button
          className="btn btn-primary mt-16 w-full"
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

            // スクロールを一番最後にする
            setTimeout(() => {
              const target = document.getElementById(currentRow);
              target.scrollLeft = target.scrollWidth;
            }, 3);
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ChordProgressionManager;
