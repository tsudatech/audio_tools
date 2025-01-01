// App.js
import React from "react";

function TopPage() {
  return (
    <div className="w-full">
      <div className="container">
        <a href="/pitch-shifter/" className="card bg-neutral w-96 shadow-2xl">
          <figure>
            <img
              src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
              alt="Shoes"
            />
          </figure>
          <div className="card-body">
            <h2 className="card-title">Audio Pitch Shifter</h2>
            <p>If a dog chews shoes whose shoes does he choose?</p>
          </div>
        </a>
      </div>
    </div>
  );
}

export default TopPage;
