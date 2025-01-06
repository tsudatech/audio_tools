// App.js
import React, { useLayoutEffect, useState } from "react";
import Footer from "../common/Footer";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import TopPage from "./TopPage";
import PitchShifter from "../pitchShifter/PitchShifter";
import Navbar from "../common/Navbar";
import PitchShifterIcon from "../../assets/pitch-shifter.png";
import AngoCatTools from "../../assets/angocat-tools.png";
import ReactGA from "react-ga4";
import ChordProgressionManager from "../chordProgressionManager/ChordProgressionManager";

function Tools() {
  const location = useLocation();
  const [title, setTitle] = useState();
  const [icon, setIcon] = useState();

  useLayoutEffect(() => {
    let faviconUrl = "angocat-tools.png";
    if (matchPath("/pitch-shifter", location.pathname)) {
      setIcon(PitchShifterIcon);
      setTitle("Audio Pitch Shifter");
      document.title = "Audio Pitch Shifter";
      faviconUrl = "pitch-shifter.png";
    } else {
      setIcon(AngoCatTools);
      setTitle("AngoCat Tools");
      document.title = "AngoCat Tools";
    }

    // faviconの動的変更
    const link = document.querySelector("#favicon");
    if (link) {
      const currentHref = link.href;
      const baseUrl = currentHref.split("/").slice(0, -1).join("/");
      link.href = `${baseUrl}/${faviconUrl}`;
    }

    // GA送付
    if (window.location.hostname.endsWith("angocat.com")) {
      ReactGA.initialize("G-JM9CMHLBLK");
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname,
      });
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
          <Route
            path="/chord-progression-manager"
            element={<ChordProgressionManager />}
          />
          <Route path="*" element={<TopPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default Tools;
