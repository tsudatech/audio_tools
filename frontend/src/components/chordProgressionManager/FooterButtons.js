import React from "react";

/**
 * コンポーネント本体
 * @returns
 */
const FooterButtons = (props) => {
  const { tempo, setTempo, cookieEnabled, saveToCookies, deleteCookies } =
    props;
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

      <div className="btn">Export to csv</div>
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
      <dialog id="stop_saving_cookies_dialog" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirmation</h3>
          <p className="py-4">
            Are you sure you want to stop saving to cookies?
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn mr-4">Cancel</button>
              <button className="btn" onClick={deleteCookies}>
                OK
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default FooterButtons;
