// App.js
import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import Tools from "./tools/Tools";
import { BrowserRouter as Router } from "react-router-dom";

function App() {
  return (
    <div className="w-full h-full">
      <Router>
        <Tools />
      </Router>
    </div>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
