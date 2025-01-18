// App.js
import React from "react";

function ErrorMsg(props) {
  return (
    <div
      role="alert"
      className="alert alert-error flex justify-center items-center pr-4 rounded-lg"
      style={{
        backgroundColor: "#EF9A9A",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{props.msg}</span>
    </div>
  );
}

export default ErrorMsg;
