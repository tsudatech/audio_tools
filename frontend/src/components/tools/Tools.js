// App.js
import React, { useLayoutEffect, useState } from "react";
import Footer from "../common/Footer";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import TopPage from "./TopPage";
import Navbar from "../common/Navbar";
import Chords from "../chords/Chords";
import Strudeler from "../strudeler/Strudeler";

function Tools() {
  const location = useLocation();
  const [title, setTitle] = useState();

  useLayoutEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    const metaDescription = document.querySelector('meta[name="description"]');
    if (matchPath("/chords", location.pathname)) {
      setTitle("Chords");
      document.title = "Chorder";
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=1280";
      document.head.appendChild(meta);
      metaDescription.setAttribute(
        "content",
        "Organize chord progressions with Chords."
      );
    } else if (matchPath("/strudeler", location.pathname)) {
      setTitle("Strudeler");
      document.title = "Strudeler";
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=1280";
      document.head.appendChild(meta);
      metaDescription.setAttribute(
        "content",
        "Organize Strudel codes and jsons."
      );
    } else {
      setTitle("Tools");
      document.title = "Tools";
      metaViewport.remove();
    }
  }, [location.pathname]);

  return (
    <div className="w-full h-full flex flex-col" style={{ flex: 1 }}>
      <Navbar title={title} />
      <div style={{ flexGrow: "inherit" }}>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/chords" element={<Chords />} />
          <Route path="/strudeler" element={<Strudeler />} />
          <Route path="*" element={<TopPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default Tools;
