// App.js
import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import PitchShifter from "./PitchShifter";
import Footer from "./Footer";
import Navbar from "./Navbar";
import Description from "./Description";

function App() {
  return (
    <div className="">
      <Navbar />
      <PitchShifter />
      <Description />
      <Footer />
    </div>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
