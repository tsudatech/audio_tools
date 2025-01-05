import React, { useState, useEffect } from "react";
import * as Tone from "tone";
import { chordToNotes } from "../utils";

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

const Equalizer = () => {
  const [chords, setChords] = useState([[]]);
  const [selectedScale, setSelectedScale] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("");
  const [selectedTensions, setSelectedTensions] = useState([]);
  const [selectedFraction, setSelectedFraction] = useState("");

  const playChord = async () => {
    // Audioコンテキストの解放を待つ
    await Tone.start();

    // PolySynth（ポリフォニックシンセサイザー）を作成
    const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();

    // コードを指定（Cメジャー: C4, E4, G4）
    const _chords = chords[0].map((c) => [c, 4]);
    const plus_key = 2;

    // コードを鳴らす（1秒間再生）
    Tone.getTransport().bpm.value = 160;

    // Transportのリセット
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    Tone.getTransport().position = 0; // 再生位置をリセット

    let bar = 0;
    let beat = 0;
    for (const c of _chords) {
      const chord = chordToNotes(c[0], c[1], plus_key);

      // 音をスケジュール
      Tone.getTransport().schedule((time) => {
        polySynth.triggerAttackRelease(chord, "3n", time);
      }, `${bar}:${beat}:0`);

      if (bar % 2 == 0) {
        beat += 2;
      } else if (beat == 2) {
        bar++;
        beat = 0;
      }
    }

    Tone.getTransport().start();
  };

  return (
    <div className="container pl-16 grid grid-cols-3 h-full flex flex-row">
      <div
        className="container col-span-2 h-full"
        style={{
          backgroundColor: "rgb(24,28,32)",
        }}
      >
        <div className="container">{chords[0].map((c) => c)}</div>
        <div className="btn btn-primary" onClick={playChord}>
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
            const newChords = [[...chords[0]]];
            let _selectedTensions = selectedTensions.join("add");
            if (_selectedTensions) {
              _selectedTensions = "add" + _selectedTensions;
            }

            let _selectedFraction = selectedFraction;
            if (_selectedFraction) {
              _selectedFraction = "/" + _selectedFraction;
            }
            newChords[0].push(
              `${selectedScale}${intervals[selectedInterval]}${_selectedTensions}${_selectedFraction}`
            );
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
