import React, { useState, useEffect } from "react";
import { playChord, downloadMidiFile } from "./utils";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DraggableRow } from "./DraggableRow";
import { DraggableChord } from "./DraggableChord";
import { DroppableChord } from "./DroppableChord";
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

/**
 * コードを表示する
 * @param {*} chords
 * @returns
 */
const displayChords = (rowId, chords, isOverDifferent) => {
  const ret = [];

  ret.push(
    <DroppableChord
      id={rowId + "_first"}
      fullWidth={chords.length == 0}
      isOverDifferent={isOverDifferent}
    >
      <div className="h-28 w-2.5"></div>
    </DroppableChord>
  );

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    ret.push(
      <DraggableChord id={rowId + "_" + chord.id}>
        <div className="h-28 w-28 bg-base-300 bg-opacity-60 rounded-lg flex items-center justify-center ">
          <p
            className="text-xl h-full w-full flex items-center justify-center"
            style={{ wordBreak: "break-word" }}
          >
            {chord.label}
          </p>
        </div>
      </DraggableChord>
    );

    ret.push(
      <DroppableChord
        id={rowId + "_" + chord.id}
        fullWidth={i == chords.length - 1}
        isOverDifferent={isOverDifferent}
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
const ChordProgressionManager = () => {
  const [chords, setChords] = useState({});
  const [currentRow, setCurrentRow] = useState("");
  const [selectedScale, setSelectedScale] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("");
  const [selectedTensions, setSelectedTensions] = useState([]);
  const [selectedFraction, setSelectedFraction] = useState("");
  const [isOverDifferent, setIsOverDifferent] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const id = uuidv4();
    setChords({ [id]: [] });
    setCurrentRow(id);
  }, []);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (
      !over ||
      active.id == over.id ||
      !over.data.current.accepts.includes(active.data.current.type)
    ) {
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
      className={`
        container pl-16 grid grid-cols-4 h-full flex flex-row
        justify-start items-start transform origin-top`}
      style={{ maxWidth: "2000px", transform: "scale(.85)" }}
    >
      <div
        className={`
          container justify-start p-0 col-span-3 h-full max-h-full
          rounded-lg overflow-y-scroll`}
      >
        <div
          id="row-wrapper"
          className={`
            container bg-base-300 bg-opacity-50 justify-start
            p-8 rounded-lg overflow-y-scroll`}
          style={{ height: "1024px" }}
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
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={(event) => {
              const { active } = event;
              Tone.getTransport().stop();
              setCurrentRow(active.id);
            }}
            onDragOver={(event) => {
              const { active, over } = event;
              if (!over) {
                return;
              }
              if (
                !over.data.current.accepts.includes(active.data.current.type)
              ) {
                setIsOverDifferent(true);
              } else {
                setIsOverDifferent(false);
              }
            }}
          >
            {Object.entries(chords).map(([id, chord]) => {
              return (
                <DraggableRow
                  id={id}
                  onDoubleClick={() => playChord(chord || [])}
                  className={`
                    container bg-neutral hover:bg-neutral-content: hover:bg-opacity-70 h-52
                    rounded-lg overflow-visible pl-8 items-start mb-8 flex-none`}
                  style={{
                    borderColor: currentRow == id ? COLOR_ACCENT : "none",
                    borderWidth: currentRow == id ? 3 : 0,
                    width: "initial",
                    minWidth: "100%",
                    maxWidth: "initial",
                  }}
                >
                  <div
                    className="flex w-full overflow-visible"
                    style={{ minWidth: "751px" }}
                  >
                    <div className="flex items-center">
                      <p>Name: </p>
                      <input
                        type="text"
                        className="input bg-base-100 bg-opacity-60 w-full max-w-xs h-8 ml-2"
                      />
                    </div>
                    <div className="ml-2">
                      <OptionButton onClick={() => playChord(chord || [])}>
                        Play
                      </OptionButton>
                      <OptionButton onClick={() => Tone.getTransport().stop()}>
                        Stop
                      </OptionButton>
                      <OptionButton
                        onClick={() => {
                          // TODO: if there are no chord, raise an alert

                          downloadMidiFile(chord);
                        }}
                      >
                        Download MIDI
                      </OptionButton>
                      <OptionButton onClick={() => {}}>Duplicate</OptionButton>
                      <OptionButton onClick={() => {}}>Delete</OptionButton>
                    </div>
                  </div>
                  <div className="flex w-full mt-5">
                    {displayChords(id, chord || [], isOverDifferent)}
                  </div>
                </DraggableRow>
              );
            })}
          </DndContext>
        </div>
        <div className="mt-6 flex w-full space-x-4">
          <div className="btn">Save to cookies</div>
          <div className="btn">Export to csv</div>
          <div className="flex items-center">
            <select className="select select-bordered w-full max-w-xs ml-2">
              <option disabled selected>
                Sound
              </option>
              <option>Sine</option>
              <option>Piano</option>
            </select>
          </div>
        </div>
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

          {/* 空白調整用 */}
          <div className="join-item w-32 rounded-none" />
          <div className="join-item w-32 rounded-none" />
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

          {/* 空白調整用 */}
          <div className="join-item w-32 rounded-none" />
          <div className="join-item w-32 rounded-none" />
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

/**
 * UIパーツ
 * @returns
 */
const Space = () => <div className="h-14"></div>;
const OptionButton = (props) => (
  <div
    className="btn btn-neutral h-8 ml-2"
    style={{ minHeight: "initial" }}
    onClick={props.onClick}
  >
    {props.children}
  </div>
);
const Container = (props) => (
  <div className="join col-span-1 block flex flex-wrap justify-center">
    {props.children}
  </div>
);

export default ChordProgressionManager;
