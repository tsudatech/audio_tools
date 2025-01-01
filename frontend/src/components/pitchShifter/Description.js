// App.js
import React from "react";

function Description() {
  return (
    <div className="container mt-7 sm:mt-14 justify-start items-center">
      <div class="max-w-xl ml-2">
        <div>
          <h1 class="text text-2xl font-bold">
            Welcome to Youtube Pitch Shifter!
          </h1>
          <p className="mt-4">
            Transform your YouTube experience with our easy-to-use pitch
            adjustment and download tool. With our service, you can:
          </p>
          <ul class="list-disc pl-5 text mt-4">
            <li>
              Adjust the pitch of any YouTube video to suit your preferences.
            </li>
            <li>Download the modified video or audio for offline use.</li>
            <li>Enjoy seamless processing and high-quality results.</li>
          </ul>
        </div>
        <div class="mt-8">
          <h1 class="text text-2xl font-bold">How It Works:</h1>
          <ol class="list-decimal pl-5 text mt-4">
            <li>Paste the URL of the YouTube video you want to modify.</li>
            <li>Choose your desired pitch settings.</li>
            <li>Preview the changes in real-time.</li>
            <li>Download the adjusted file instantly.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Description;
