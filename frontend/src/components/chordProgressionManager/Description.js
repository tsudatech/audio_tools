// App.js
import React from "react";

function Description() {
  return (
    <div
      className="container pl-2 mt-24 justify-start items-start"
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
          <p className="mt-4">Key Features:</p>
          <ul class="list-disc pl-5 text mt-4">
            <li>
              All-in-One Management: Organize and manage all your chord
              progressions in one convenient place.
            </li>
            <li>
              Flexible Editing: Easily move and adjust chords across different
              progressions to refine your creations.
            </li>
            <li>
              Real-Time Playback: Instantly test your progressions by playing
              them directly within the tool.
            </li>
            <li>
              Save and Restore Anytime: Save your progressions to Cookies or
              export them as JSON files for quick restoration.
            </li>
            <li>
              MIDI File Export: Export your progressions as MIDI files and
              seamlessly integrate them into your favorite DAW or music
              software.
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
