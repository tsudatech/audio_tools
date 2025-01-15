import React from "react";
import Modal from "../common/Modal";

/**
 * コンポーネント本体
 * @returns
 */
const FooterButtons = (props) => {
  const {
    tempo,
    setTempo,
    cookieEnabled,
    saveToCookies,
    deleteCookies,
    exportJson,
    handleImportJson,
  } = props;
  return (
    <div className="h-16 mt-6 flex items-start w-full space-x-4">
      {/* Cookieへの保存処理ボタン */}
      {!cookieEnabled ? (
        <div className="btn btn-accent" onClick={() => saveToCookies()}>
          Save to cookies
        </div>
      ) : (
        <div
          className="btn"
          onClick={() =>
            document.getElementById("stop_saving_cookies_dialog").showModal()
          }
        >
          Disable cookies
        </div>
      )}

      <div className="btn" onClick={exportJson}>
        Export JSON
      </div>
      <div className="btn ml-2" onClick={handleImportJson}>
        Import JSON
      </div>
      <div className="flex items-center">
        <select className="select select-bordered w-full max-w-xs ml-2">
          <option disabled selected>
            Sound
          </option>
          <option>Sine</option>
          <option>Piano</option>
        </select>
      </div>
      <div>
        <input
          type="number"
          value={tempo}
          placeholder="Tempo"
          className="input input-bordered w-full max-w-xs"
          onChange={(event) => setTempo(event.target.value)}
        />
      </div>

      {/* cookieをdisableするかどうかのダイアログ */}
      <Modal
        id="stop_saving_cookies_dialog"
        text="Are you sure you want to stop saving to cookies?"
        onOk={deleteCookies}
      />
    </div>
  );
};

export default FooterButtons;
