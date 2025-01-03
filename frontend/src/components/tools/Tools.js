// App.js
import React, { useLayoutEffect, useState } from "react";
import Footer from "../common/Footer";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import TopPage from "./TopPage";
import PitchShifter from "../pitchShifter/PitchShifter";
import Navbar from "../common/Navbar";
import PitchShifterIcon from "../../assets/pitch-shifter.png";
import AudioToolsIcon from "../../assets/audio-tools.png";

function Tools() {
  const location = useLocation();
  const [title, setTitle] = useState();
  const [icon, setIcon] = useState();

  useLayoutEffect(() => {
    if (matchPath("/pitch-shifter", location.pathname)) {
      setIcon(PitchShifterIcon);
      setTitle("Audio Pitch Shifter");
      document.title = "Audio Pitch Shifter";
    } else {
      setIcon(AudioToolsIcon);
      setTitle("AngoCat Tools");
      document.title = "AngoCat Tools";
    }
  }, [location.pathname]);

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        flex: 1,
      }}
    >
      <Navbar title={title} icon={icon} />
      <div
        style={{
          flexGrow: "inherit",
        }}
      >
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/pitch-shifter" element={<PitchShifter />} />
          <Route path="*" element={<TopPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default Tools;
