// App.js
import React from "react";

function Navbar(props) {
  return (
    <div className="navbar bg-base-100 mb-7 sm:mb-14">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/audio-clipper">Audio Clipper</a>
              <a href="/pitch-shifter">Audio Pitch Shifter</a>
              <a href="/chord-progression-manager">Code Progression Manager</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="navbar-center">
        <div className="text-2xl font-bold flex">
          <img src={props.icon} style={{ height: 32 }} />
          <p className="ml-2">{props.title}</p>
        </div>
      </div>
      <div className="navbar-end"></div>
    </div>
  );
}

export default Navbar;
