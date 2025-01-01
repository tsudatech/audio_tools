// App.js
import React from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import Tools from "./tools/Tools";

function App() {
  return (
    <div className="w-full h-full">
      <Tools />
    </div>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
