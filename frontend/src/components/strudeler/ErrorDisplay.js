import React from "react";

function ErrorDisplay({ error, onClose }) {
  if (!error) return null;

  return (
    <div
      className="bg-red-900 border border-red-600 rounded-lg p-3 mb-3 shadow-lg"
      style={{ width: "100%" }}
    >
      <div className="text-red-200">
        <p className="text-sm">{error.message}</p>
      </div>
    </div>
  );
}

export default ErrorDisplay;
