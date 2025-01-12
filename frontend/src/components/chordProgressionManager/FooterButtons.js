import React from "react";

/**
 * コンポーネント本体
 * @returns
 */
const FooterButtons = (props) => {
  const { tempo, setTempo } = props;
  return (
    <div className="h-16 mt-6 flex items-start w-full space-x-4">
      <div className="btn">Save to cookies</div>
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
    </div>
  );
};

export default FooterButtons;
