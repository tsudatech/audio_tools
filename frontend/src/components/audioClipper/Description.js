// App.js
import React from "react";

function Description() {
  return (
    <div className="container mt-8 sm:mt-14 justify-start items-center">
      <div class="max-w-xl ml-2">
        <div>
          <h1 class="text text-2xl font-bold">
            Transform Your Audio Instantly! 🎵
          </h1>
          <p className="mt-4">
            Welcome to Audio Pitch Shifter, the ultimate online tool for audio
            enthusiasts! With our platform, you can:
          </p>
          <ul class="list-disc pl-5 text mt-4">
            <li>
              Change the pitch of any audio file—supports all popular formats.{" "}
            </li>
            <li>Preview the modified audio directly in your browser.</li>
            <li>Download your transformed files in just a few clicks.</li>
          </ul>
        </div>
        <p class="mt-8">
          No need for complicated software—our web-based solution makes it
          simple and accessible for everyone. Whether you're a musician, a
          podcaster, or someone experimenting with sound, Audio Pitch Shifter
          lets you work with any audio file effortlessly.
        </p>
        <p class="mt-4">Start transforming your audio today! 🚀</p>
      </div>
    </div>
  );
}

export default Description;
