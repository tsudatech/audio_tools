import * as Tone from "tone";
import MidiWriter from "midi-writer-js";
import Cookies from "js-cookie";

const noteFrequencies = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const intervals = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
};

// テンションノートを0〜11の範囲で定義
const tensions = {
  9: 2, // Major 9th
  b9: 1, // Flat 9th
  "#9": 3, // Sharp 9th
  11: 5, // Perfect 11th
  "#11": 6, // Augmented 11th
  13: 9, // Major 13th
  b13: 8, // Flat 13th
};

export function chordToNotes(chordName, octave = 4, plus_key = 0) {
  // "/X"があるか確認
  const slashMatch = chordName.match(/\/([A-G#b]+)/);
  const additionalNote = slashMatch ? slashMatch[1] : null;

  // スラッシュ部分を取り除いてルート音とクオリティを取得
  const rootMatch = chordName.match(/^([A-G#b]+)/);
  if (!rootMatch) throw new Error(`Invalid chord name: ${chordName}`);

  const root = rootMatch[1];
  const quality = chordName
    .slice(root.length)
    .toLowerCase()
    .replace(/\/[A-G#b]+/, ""); // "/X"部分を除去

  let intervalSet = intervals.major; // Default to major chord

  // 判定: コードのクオリティ（種類）
  if (quality.includes("dim")) {
    intervalSet = intervals.diminished;
  } else if (quality.includes("aug")) {
    intervalSet = intervals.augmented;
  } else if (quality.includes("maj7")) {
    intervalSet = intervals.major7;
  } else if (quality.includes("m7")) {
    intervalSet = intervals.minor7;
  } else if (quality.includes("7")) {
    intervalSet = intervals.dominant7;
  } else if (quality.includes("m") && !quality.includes("maj")) {
    intervalSet = intervals.minor;
  }

  // "addX" 形式のテンションノート解析
  const tensionMatch = quality.match(/add(b?9|#?9|11|#11|b?13)/g) || [];
  const tensionIntervals = tensionMatch.map(
    (tension) => tensions[tension.slice(3)]
  ); // "add"部分をスライス

  const rootValue = noteFrequencies[root];
  if (rootValue === undefined) throw new Error(`Invalid root note: ${root}`);

  // 音名の計算
  const notes = [...intervalSet, ...tensionIntervals].map((interval, index) => {
    const noteValue = (rootValue + interval + plus_key) % 12;
    const noteOctave = octave + Math.floor((rootValue + interval) / 12);

    const noteName = Object.keys(noteFrequencies).find(
      (key) => noteFrequencies[key] === noteValue
    );

    // ルート以外の音がルートより低くならないように調整
    return `${noteName}${index === 0 ? octave : Math.max(octave, noteOctave)}`;
  });

  // "/X"が存在した場合、その音をルート音より低い音として追加
  if (additionalNote) {
    const additionalNoteValue = noteFrequencies[additionalNote];
    if (additionalNoteValue === undefined)
      throw new Error(`Invalid additional note: ${additionalNote}`);

    // 追加する音をルートより低くするため、オクターブを1つ下げて追加
    const additionalNoteOctave = octave - 1;
    const additionalNoteName = Object.keys(noteFrequencies).find(
      (key) => noteFrequencies[key] === additionalNoteValue
    );

    notes.push(`${additionalNoteName}${additionalNoteOctave}`);
  }

  return notes;
}

/**
 * コードを演奏する
 * @param {*} chords
 */
export const playChord = async (chords, tempo) => {
  // Audioコンテキストの解放を待つ
  await Tone.start();

  // PolySynth（ポリフォニックシンセサイザー）を作成
  const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();

  // コードを指定（Cメジャー: C4, E4, G4）
  const _chords = chords.map((c) => [c.chord, 4]);
  const plus_key = 0;

  // コードを鳴らす（1秒間再生）
  Tone.getTransport().bpm.value = tempo;

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
      polySynth.triggerAttackRelease(chord, "5n", time);
    }, `${bar}:${beat}:0`);

    beat += 1;
    if (beat == 4) {
      bar++;
      beat = 0;
    }
  }

  Tone.getTransport().start();
};

/**
 * コード進行をMIDIファイルとしてダウンロード
 * @param {*} chords
 */
export function downloadMidiFile(chords, tempo) {
  // Start with a new track
  const track = new MidiWriter.Track();

  const notes = [];
  const labels = [];
  chords.forEach((c) => {
    // TODO: change 4, 0
    const chord = chordToNotes(c.chord, 4, 0);
    labels.push(c.label);
    notes.push(
      new MidiWriter.NoteEvent({
        pitch: chord,
        duration: "4",
      })
    );
  });

  const trackName = labels.join("-");
  track.addTrackName(trackName);
  track.addEvent(notes);
  track.setTempo(tempo);

  // Generate a data URI
  const write = new MidiWriter.Writer(track);
  const a = document.createElement("a");
  a.href = write.dataUri();
  a.download = trackName + ".mid"; // 保存するファイル名
  a.click();
  document.removeChild(a);
}

/**
 * Cookieにオブジェクトを保存
 * @param {*} key
 * @param {*} obj
 */
export const saveObjectToCookie = (key, obj) => {
  try {
    // Cookieが利用可能か確認
    Cookies.set("test_cookie", "test", { expires: 1 });
    const testValue = Cookies.get("test_cookie");
    if (testValue !== "test") {
      throw new Error(
        "Cookies are not enabled or accessible in this environment."
      );
    }
    // テスト用Cookieを削除
    Cookies.remove("test_cookie");

    // オブジェクトをJSON文字列に変換して保存
    Cookies.set(key, JSON.stringify(obj), { expires: 7 }); // 有効期限7日
  } catch (error) {
    console.error("Failed to save object to cookie:", error.message);
  }
};

// Cookieからオブジェクトを取得する
export const getObjectFromCookie = (key) => {
  // Cookieから取得してパース
  const value = Cookies.get(key);
  return value ? JSON.parse(value) : null;
};

// Cookieを削除する関数
export const deleteCookie = (key) => {
  try {
    Cookies.remove(key);
    console.log(`Cookie with key "${key}" has been deleted.`);
  } catch (error) {
    console.error(`Failed to delete cookie with key "${key}":`, error.message);
  }
};
