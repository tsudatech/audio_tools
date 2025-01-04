import React, { useState, useEffect } from "react";
import * as Tone from "tone";

const Equalizer = () => {
  const [file, setFile] = useState(null);
  const [eq, setEq] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    // Tone.EQ3のインスタンスを作成
    const eqInstance = new Tone.EQ3(0, 0, 0); // 初期値としてそれぞれのバンドに適当な値を設定
    setEq(eqInstance);

    // クリーンアップ
    return () => {
      if (eqInstance) eqInstance.dispose();
      if (player) player.dispose();
    };
  }, [player]);

  // ファイルを読み込むハンドラ
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const url = URL.createObjectURL(file);

      // Tone.Playerで音源を読み込む
      const newPlayer = new Tone.Player({
        url: url,
        autostart: false,
      }).toDestination();

      // EQを音源に適用
      newPlayer.connect(eq);
      setPlayer(newPlayer);
      setFile(file);
    }
  };

  // EQの設定を変更するハンドラ
  const handleEQChange = (band, value) => {
    if (eq) {
      switch (band) {
        case "bass":
          eq.low.value = value;
          break;
        case "mid":
          eq.mid.value = value;
          break;
        case "treble":
          eq.high.value = value;
          break;
        default:
          break;
      }

      if (file) {
        const url = URL.createObjectURL(file);

        // Tone.Playerで音源を読み込む
        const newPlayer = new Tone.Player({
          url: url,
          autostart: false,
        }).toDestination();

        // EQを音源に適用
        newPlayer.connect(eq);
        setPlayer(newPlayer);
        setEq(eq);
      }
    }
  };

  // 再生ボタン
  const handlePlay = () => {
    if (player) {
      player.start();
    }
  };

  return (
    <div className="container">
      {/* ファイル選択 */}
      <input type="file" onChange={handleFileChange} accept="audio/*" />

      <div>
        <label>
          Bass:
          <input
            className="range"
            type="range"
            min="-30"
            max="30"
            onMouseUp={(e) =>
              handleEQChange("bass", parseFloat(e.target.value))
            }
          />
        </label>
      </div>
      <div>
        <label>
          Mid:
          <input
            className="range"
            type="range"
            min="-30"
            max="30"
            onMouseUp={(e) => handleEQChange("mid", parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Treble:
          <input
            className="range"
            type="range"
            min="-30"
            max="30"
            onMouseUp={(e) =>
              handleEQChange("treble", parseFloat(e.target.value))
            }
          />
        </label>
      </div>

      {/* 再生ボタン */}
      <button onClick={handlePlay}>Play</button>
    </div>
  );
};

export default Equalizer;
