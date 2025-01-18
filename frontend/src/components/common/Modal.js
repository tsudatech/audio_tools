import React from "react";

/**
 * コンポーネント本体
 * @returns
 */
const Modal = (props) => {
  const { id, title, text, onOk } = props;
  return (
    <dialog id={id} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title || "Confirmation"}</h3>
        <p className="py-4">{text}</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn mr-4">Cancel</button>
            <button className="btn" onClick={onOk}>
              OK
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default Modal;
