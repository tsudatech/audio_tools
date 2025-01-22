// App.js
import React from "react";

function Description() {
  return (
    <div className="container mt-8 sm:mt-14 justify-start items-center">
      <div className="max-w-xl ml-2">
        <div>
          <h1 className="text text-2xl font-bold">
            Easily Trim Your Audio! 🎶
          </h1>
          <p className="mt-4">
            Welcome to Audio Clipper, the ultimate tool for seamless audio
            editing. With our intuitive platform, you can:
          </p>
          <ul className="list-disc pl-5 text mt-4">
            <li>
              Trim your audio files to perfection—supporting all major formats.
            </li>
            <li>Preview your edits instantly in your browser.</li>
            <li>Download the clipped audio with just a few clicks.</li>
          </ul>
        </div>
        <p className="mt-8">
          Say goodbye to complicated software! Our web-based tool is fast, easy
          to use, and perfect for anyone—whether you're a musician, a content
          creator, or simply experimenting with sound.
        </p>
        <p className="mt-4">Start clipping your audio effortlessly today! 🚀</p>
      </div>
    </div>
  );
}

export default Description;
