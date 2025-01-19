// App.js
import React from "react";

function Description() {
  return (
    <div
      className="container pl-2 mt-40 justify-start items-start"
      style={{
        scale: 1 / 0.85,
        transformOrigin: "left",
      }}
    >
      <div class="ml-2" style={{ width: "calc(100% * 0.85)" }}>
        <div>
          <h1 class="text text-2xl font-bold">
            Welcome to Chord Progression Manager🎵
          </h1>
          <p className="mt-4">
            Take your music composition to the next level with our powerful
            chord progression management tool!
          </p>
          <p className="mt-8 text-xl font-bold">Key Features:</p>
          <ul class="list-disc pl-5 text mt-4 space-y-2">
            <li>
              <span class="font-bold">All-in-One Management:</span> Organize and
              manage all your chord progressions in one convenient place.
            </li>
            <li>
              <span class="font-bold">Flexible Editing:</span> Easily move and
              adjust chords across different progressions to refine your
              creations.
            </li>
            <li>
              <span class="font-bold">Real-Time Playback:</span> Instantly test
              your progressions by playing them directly within the tool.
            </li>
            <li>
              <span class="font-bold">Save and Restore Anytime:</span> Save your
              progressions to Cookies or export them as JSON files for quick
              restoration.
            </li>
            <li>
              <span class="font-bold">MIDI File Export:</span> Export your
              progressions as MIDI files and seamlessly integrate them into your
              favorite DAW or music software.
            </li>
          </ul>
          <p className="mt-8 text-xl font-bold">Basic Operations:</p>
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
        <p class="mt-4">
          Start creating and managing your chord progressions effortlessly
          today! 🚀
        </p>
      </div>
    </div>
  );
}

export default Description;
