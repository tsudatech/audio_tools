import React, { useState, useEffect } from "react";
import * as Tone from "tone";
import { chordToNotes } from "../utils";

const Equalizer = () => {
  const playChord = async () => {
    // Audioコンテキストの解放を待つ
    await Tone.start();

    // PolySynth（ポリフォニックシンセサイザー）を作成
    const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();

    // コードを指定（Cメジャー: C4, E4, G4）
    const chords = ["Cm7add9", "Fmaj7", "G7", "Cmaj7"];

    // コードを鳴らす（1秒間再生）
    Tone.getTransport().bpm.value = 160;

    // Transportのリセット
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    Tone.getTransport().position = 0; // 再生位置をリセット

    let bar = 0;
    let beat = 0;
    for (const c of chords) {
      const chord = chordToNotes(c);

      // 音をスケジュール
      Tone.getTransport().schedule((time) => {
        polySynth.triggerAttackRelease(chord, "4n", time);
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
    <div>
      <button onClick={playChord}>Play C Major Chord</button>
    </div>
  );
};

export default Equalizer;
