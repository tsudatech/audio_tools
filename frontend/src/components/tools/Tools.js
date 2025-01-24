// App.js
import React, { useLayoutEffect, useState } from "react";
import Footer from "../common/Footer";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import TopPage from "./TopPage";
import PitchShifter from "../pitchShifter/PitchShifter";
import Navbar from "../common/Navbar";
import PitchShifterIcon from "../../assets/pitch-shifter.png";
import ChordProgressionManagerIcon from "../../assets/chord-progression-manager.png";
import AudioClipperIcon from "../../assets/audio-clipper.png";
import AngoCatTools from "../../assets/angocat-tools.png";
import ChordProgressionManager from "../chordProgressionManager/ChordProgressionManager";
import ga from "../common/GAUtils";
import AudioClipper from "../audioClipper/AudioClipper";

function Tools() {
  const location = useLocation();
  const [title, setTitle] = useState();
  const [icon, setIcon] = useState();

  useLayoutEffect(() => {
    let faviconUrl = "angocat-tools.png";
    const metaViewport = document.querySelector('meta[name="viewport"]');
    const metaDescription = document.querySelector('meta[name="description"]');

    if (matchPath("/pitch-shifter", location.pathname)) {
      setIcon(PitchShifterIcon);
      setTitle("Audio Pitch Shifter");
      document.title = "Audio Pitch Shifter";
      faviconUrl = "pitch-shifter.png";
      metaViewport.remove();
      metaDescription.setAttribute(
        "content",
        "Adjust the pitch of audio effortlessly with our free pitch shifter tool. No installation required, simple to use, and perfect for music, voice, or sound effects editing."
      );
    } else if (matchPath("/chord-progression-manager", location.pathname)) {
      setIcon(ChordProgressionManagerIcon);
      setTitle("Chord Progression Manager");
      document.title = "Chord Progression Manager";
      faviconUrl = "chord-progression-manager.png";

      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=1280";
      document.head.appendChild(meta);
      metaDescription.setAttribute(
        "content",
        "Organize chord progressions effortlessly with our Chord Progression Manager. It is easy to use and perfect for musicians and composers of all levels."
      );
    } else if (matchPath("/audio-clipper", location.pathname)) {
      setIcon(AudioClipperIcon);
      setTitle("Audio Clipper");
      document.title = "Audio Clipper";
      faviconUrl = "audio-clipper.png";
      metaViewport.remove();
      metaDescription.setAttribute(
        "content",
        "Trim your audio files effortlessly with our Audio Clipper. Easy to use, no installation required, and completely free!"
      );
    } else {
      setIcon(AngoCatTools);
      setTitle("AngoCat Tools");
      document.title = "AngoCat Tools";
      metaViewport.remove();
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
      ga.initGoogleAnalytics();
      ga.sendData("pageview", { page: location.pathname });
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
          <Route path="/audio-clipper" element={<AudioClipper />} />
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
