// App.js
import React from "react";

function Description() {
  return (
    <div
      className="container pl-2 mt-28 justify-start items-start"
      style={{
        scale: 1 / 0.85,
        transformOrigin: "left",
      }}
    >
      <div class="ml-2" style={{ width: "calc(100% * 0.85)" }}>
        <div>
          <p className="text-xl font-bold">Basic Operations:</p>
          <ul class="list-disc pl-5 text mt-4 space-y-2">
            <li>
              <span class="font-bold">Add Chord:</span> Adds a new chord to a
              row.
            </li>
            <li>
              <span class="font-bold">Add Row:</span> Adds a new row.
            </li>
            <li>
              <span class="font-bold">Play:</span> Plays the chord progression.
              You can also play it by double-clicking a row or selecting a row
              and pressing the spacebar.
            </li>
            <li>
              <span class="font-bold">Stop:</span> Stops playback. You can also
              stop it by clicking on a playing or non-playing row.
            </li>
            <li>
              <span class="font-bold">Download MIDI:</span> Downloads a MIDI
              file. The specified tempo will be reflected in the downloaded MIDI
              file.
            </li>
            <li>
              <span class="font-bold">Duplicate:</span> Duplicates a row.
            </li>
            <li>
              <span class="font-bold">Delete:</span> Deletes a row.
            </li>
            <li>
              <span class="font-bold">Save to Cookies:</span> Saves the current
              information to Cookies. The data will be retained even after
              reloading the page.
            </li>
            <li>
              <span class="font-bold">Export JSON:</span> Downloads the current
              information in JSON format.
            </li>
            <li>
              <span class="font-bold">Import JSON:</span> Restores information
              from a previously downloaded JSON file.
            </li>
            <li>
              <span class="font-bold">Sound:</span> Changes the instrument sound
              used for playing the chord progression.
            </li>
            <li>
              <span class="font-bold">Tempo:</span> Adjusts the tempo for
              playing the chord progression.
            </li>
            <li>
              <span class="font-bold">Drag and Drop Features:</span> You can
              move chords using drag-and-drop. Rows can also be reordered using
              drag-and-drop.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Description;
