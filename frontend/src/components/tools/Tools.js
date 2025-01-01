// App.js
import React from "react";
import Footer from "../common/Footer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TopPage from "./TopPage";
import PitchShifter from "../pitchShifter/PitchShifter";
import Navbar from "../common/Navbar";
import Icon from "../../assets/pitch-shifter.png";

function Tools() {
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        flex: 1,
      }}
    >
      <Navbar title="test" />
      <div
        style={{
          flexGrow: "inherit",
        }}
      >
        <Router>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/pitch-shifter" element={<PitchShifter />} />
            <Route path="*" element={<TopPage />} />
          </Routes>
        </Router>
      </div>
      <Footer />
    </div>
  );
}

export default Tools;
