import React, { useState } from "react";
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

/**
 * コンポーネント本体
 * @returns
 */
const ChordPanel = (props) => {
  const { chords, setChords, currentRow, setError } = props;
  const [selectedScale, setSelectedScale] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("");
  const [selectedTensions, setSelectedTensions] = useState([]);
  const [selectedFraction, setSelectedFraction] = useState("");

  return (
    <div className="container pr-0">
      <button
        className="btn btn-primary mt-8 mb-8 w-full"
        onClick={() => {
          if (!selectedScale || !selectedInterval) {
            setError("Scale and intervals have to be selected");
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
          setError("");
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
            onClick={() => setSelectedFraction(s == selectedFraction ? "" : s)}
          />
        ))}
      </Container>
    </div>
  );
};

/**
 * UIパーツ
 * @returns
 */
const Space = (props) => (
  <div>
    <div className={"h-14 h-" + props.h || ""}></div>
  </div>
);
const Container = (props) => (
  <div className="join col-span-1 block flex flex-wrap justify-center">
    {props.children}
  </div>
);

export default ChordPanel;
