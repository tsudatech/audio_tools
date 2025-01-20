// App.js
import React from "react";
import PitchShifterIcon from "../../assets/pitch-shifter.png";
import ChordProgressionManagerIcon from "../../assets/chord-progression-manager.png";
import AudioClipperIcon from "../../assets/audio-clipper.png";

const CARD_HEIGHT = 80;
const CARD_WIDTH = 80;

function TopPage() {
  return (
    <div className="w-full">
      <div className="container flex-row flex-wrap gap-8">
        <a
          href="/audio-clipper/"
          className="card bg-neutral max-w-96 shadow-2xl pt-8"
        >
          <figure>
            <img
              height={CARD_HEIGHT}
              width={CARD_WIDTH}
              src={AudioClipperIcon}
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Audio Clipper</h2>
            <p>
              Manage chord progressions effortlessly with real-time playback,
              flexible editing, and MIDI export—all in your browser!
            </p>
          </div>
        </a>
        <a
          href="/chord-progression-manager/"
          className="card bg-neutral max-w-96 shadow-2xl pt-8"
        >
          <figure>
            <img
              height={CARD_HEIGHT}
              width={CARD_WIDTH}
              src={ChordProgressionManagerIcon}
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Chord Progression Manager</h2>
            <p>
              Manage chord progressions effortlessly with real-time playback,
              flexible editing, and MIDI export—all in your browser!
            </p>
          </div>
        </a>
        <a
          href="/pitch-shifter/"
          className="card bg-neutral max-w-96 shadow-2xl pt-8"
        >
          <figure>
            <img
              height={CARD_HEIGHT}
              width={CARD_WIDTH}
              src={PitchShifterIcon}
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Audio Pitch Shifter</h2>
            <p>
              Transform and download any audio file with pitch adjustments, all
              in your browser—no software needed!
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}

export default TopPage;
