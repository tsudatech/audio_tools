// App.js
import React from "react";

function TopPage() {
  return (
    <div className="container w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 flex-row flex-wrap gap-8">
        <a
          href="/chord-progression-manager/"
          className="card bg-neutral shadow-2xl</div>"
        >
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Chord Progression Manager</h2>
          </div>
        </a>
        <a href="/audio-clipper/" className="card bg-neutral shadow-2xl</div>">
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Audio Clipper</h2>
          </div>
        </a>
        <a href="/image-clipper/" className="card bg-neutral shadow-2xl</div>">
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Image Clipper</h2>
          </div>
        </a>
        <a href="/pitch-shifter/" className="card bg-neutral shadow-2xl</div>">
          <div className="card-body items-center justify-center">
            <h2 className="card-title">Audio Pitch Shifter</h2>
          </div>
        </a>
      </div>
    </div>
  );
}

export default TopPage;
