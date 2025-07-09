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
    setSound,
    setVolume,
  } = props;
  return (
    <div className="h-16 mt-6 flex items-center w-full space-x-4">
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

      <div className="btn bg-neutral" onClick={exportJson}>
        Export JSON
      </div>
      <div className="btn bg-neutral ml-2" onClick={handleImportJson}>
        Import JSON
      </div>
      <div className="flex items-center w-40">
        <select
          className="select select-bordered w-full max-w-xs ml-2"
          onChange={(e) => setSound(e.target.value)}
        >
          <option value="piano" selected>
            Piano
          </option>
          <option value="casio">Casio</option>
        </select>
      </div>
      <div className="w-32">
        <input
          type="number"
          value={tempo}
          placeholder="Tempo"
          className="input input-bordered w-full max-w-xs"
          onChange={(event) => setTempo(event.target.value)}
        />
      </div>
      <div className="w-72">
        <input
          type="range"
          min={-50}
          max="0"
          defaultValue="-15"
          className="range"
          step="1"
          onChange={(event) => setVolume(event.target.value)}
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
