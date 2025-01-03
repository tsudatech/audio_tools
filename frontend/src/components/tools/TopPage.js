// App.js
import React from "react";
import PitchShifterIcon from "../../assets/pitch-shifter.png";

function TopPage() {
  return (
    <div className="w-full">
      <div className="container">
        <a
          href="/pitch-shifter/"
          className="card bg-neutral max-w-96 shadow-2xl pt-8"
        >
          <figure>
            <img height={104} width={104} src={PitchShifterIcon} />
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
