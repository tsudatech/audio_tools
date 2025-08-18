import React, { useState, useEffect } from "react";

function EditorControls({
  strudelEditorRef,
  onFlashChange,
  onHighlightChange,
}) {
  // 利用可能なテーマリスト
  const availableThemes = [
    { value: "strudelTheme", label: "Strudel Theme" },
    { value: "algoboy", label: "Algoboy" },
    { value: "archBtw", label: "Arch BTW" },
    { value: "androidstudio", label: "Android Studio" },
    { value: "atomone", label: "Atom One" },
    { value: "aura", label: "Aura" },
    { value: "bbedit", label: "BBEdit" },
    { value: "blackscreen", label: "Black Screen" },
    { value: "bluescreen", label: "Blue Screen" },
    { value: "bluescreenlight", label: "Blue Screen Light" },
    { value: "CutiePi", label: "Cutie Pi" },
    { value: "darcula", label: "Darcula" },
    { value: "dracula", label: "Dracula" },
    { value: "duotoneDark", label: "Duotone Dark" },
    { value: "eclipse", label: "Eclipse" },
    { value: "fruitDaw", label: "Fruit Daw" },
    { value: "githubDark", label: "GitHub Dark" },
    { value: "githubLight", label: "GitHub Light" },
    { value: "greenText", label: "Green Text" },
    { value: "gruvboxDark", label: "Gruvbox Dark" },
    { value: "gruvboxLight", label: "Gruvbox Light" },
    { value: "sonicPink", label: "Sonic Pink" },
    { value: "materialDark", label: "Material Dark" },
    { value: "materialLight", label: "Material Light" },
    { value: "monokai", label: "Monokai" },
    { value: "noctisLilac", label: "Noctis Lilac" },
    { value: "nord", label: "Nord" },
    { value: "redText", label: "Red Text" },
    { value: "solarizedDark", label: "Solarized Dark" },
    { value: "solarizedLight", label: "Solarized Light" },
    { value: "sublime", label: "Sublime" },
    { value: "teletext", label: "Teletext" },
    { value: "tokyoNight", label: "Tokyo Night" },
    { value: "tokyoNightDay", label: "Tokyo Night Day" },
    { value: "tokyoNightStorm", label: "Tokyo Night Storm" },
    { value: "vscodeDark", label: "VS Code Dark" },
    { value: "vscodeLight", label: "VS Code Light" },
    { value: "whitescreen", label: "White Screen" },
    { value: "xcodeLight", label: "Xcode Light" },
  ];

  // 利用可能なフォントサイズリスト
  const availableFontSizes = [
    { value: 12, label: "12px" },
    { value: 14, label: "14px" },
    { value: 16, label: "16px" },
    { value: 18, label: "18px" },
    { value: 20, label: "20px" },
    { value: 22, label: "22px" },
    { value: 24, label: "24px" },
    { value: 26, label: "26px" },
    { value: 28, label: "28px" },
    { value: 30, label: "30px" },
    { value: 32, label: "32px" },
  ];

  // 現在のテーマ状態
  const [currentTheme, setCurrentTheme] = useState(() => {
    // ローカルストレージからテーマを復元
    const savedTheme = localStorage.getItem("strudeler-theme");
    return savedTheme || "tokyoNight";
  });

  // 現在のフォントサイズ状態
  const [currentFontSize, setCurrentFontSize] = useState(() => {
    // ローカルストレージからフォントサイズを復元
    const savedFontSize = localStorage.getItem("strudeler-fontsize");
    return parseInt(savedFontSize) || 18;
  });

  // 行数表示状態
  const [showLineNumbers, setShowLineNumbers] = useState(() => {
    // ローカルストレージから行数表示設定を復元
    const savedLineNumbers = localStorage.getItem("strudeler-linenumbers");
    return savedLineNumbers !== null ? JSON.parse(savedLineNumbers) : true;
  });

  // Flash表示状態
  const [showFlash, setShowFlash] = useState(() => {
    // ローカルストレージからFlash表示設定を復元
    const savedFlash = localStorage.getItem("strudeler-flash");
    return savedFlash !== null ? JSON.parse(savedFlash) : true;
  });

  // Highlight表示状態
  const [shouldHighlight, setShouldHighlight] = useState(() => {
    // ローカルストレージからHighlight表示設定を復元
    const savedHighlight = localStorage.getItem("strudeler-highlight");
    return savedHighlight !== null ? JSON.parse(savedHighlight) : true;
  });

  // 背景色状態
  const [backgroundColor, setBackgroundColor] = useState(() => {
    // ローカルストレージから背景色を復元
    const savedBackgroundColor = localStorage.getItem(
      "strudeler-background-color"
    );
    return savedBackgroundColor || ""; // デフォルトは Night Owl base
  });

  // テーマ変更関数
  function handleThemeChange(theme) {
    setCurrentTheme(theme);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-theme", theme);
    if (strudelEditorRef.current && strudelEditorRef.current.editor) {
      strudelEditorRef.current.editor.setTheme(theme);
    }
  }

  // フォントサイズ変更関数
  function handleFontSizeChange(fontSize) {
    setCurrentFontSize(fontSize);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-fontsize", fontSize.toString());
    if (strudelEditorRef.current && strudelEditorRef.current.editor) {
      strudelEditorRef.current.editor.setFontSize(fontSize);
    }
  }

  // 行数表示切り替え関数
  function handleLineNumbersToggle() {
    const newValue = !showLineNumbers;
    setShowLineNumbers(newValue);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-linenumbers", JSON.stringify(newValue));
    if (strudelEditorRef.current && strudelEditorRef.current.editor) {
      strudelEditorRef.current.editor.setLineNumbersDisplayed(newValue);
    }
  }

  // Flash表示切り替え関数
  function handleFlashToggle() {
    const newValue = !showFlash;
    setShowFlash(newValue);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-flash", JSON.stringify(newValue));
    // 親コンポーネントに変更を通知
    if (onFlashChange) {
      onFlashChange(newValue);
    }
  }

  // Highlight表示切り替え関数
  function handleHighlightToggle() {
    const newValue = !shouldHighlight;
    setShouldHighlight(newValue);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-highlight", JSON.stringify(newValue));
    // 親コンポーネントに変更を通知
    if (onHighlightChange) {
      onHighlightChange(newValue);
    }
  }

  // 背景色変更関数
  function handleBackgroundColorChange(color) {
    setBackgroundColor(color);
    // ローカルストレージに保存
    localStorage.setItem("strudeler-background-color", color);
    // document.querySelectorでエディタの背景色を適用
    const cmGutters = document.querySelector(".cm-gutters");
    if (cmGutters) {
      cmGutters.style.backgroundColor = color;
      cmGutters.style.borderRightColor = color;
    }
    const cmContent = document.querySelector(".cm-content");
    if (cmContent) {
      cmContent.style.backgroundColor = color;
    }
  }

  // 背景色リセット関数
  function handleResetBackgroundColor() {
    setBackgroundColor(""); // stateは何か値が必要なのでデフォルト値のまま
    localStorage.removeItem("strudeler-background-color");
    // document.querySelectorでエディタの背景色をリセット
    const cmGutters = document.querySelector(".cm-gutters");
    if (cmGutters) {
      cmGutters.style.backgroundColor = "";
      cmGutters.style.borderRightColor = "";
    }
    const cmContent = document.querySelector(".cm-content");
    if (cmContent) {
      cmContent.style.backgroundColor = "";
    }
  }

  // エディタの初期化時に設定を適用
  useEffect(() => {
    if (strudelEditorRef.current && strudelEditorRef.current.editor) {
      strudelEditorRef.current.editor.setTheme(currentTheme);
      strudelEditorRef.current.editor.setFontSize(currentFontSize);
      strudelEditorRef.current.editor.setFontFamily("monospace");
      strudelEditorRef.current.editor.setLineNumbersDisplayed(showLineNumbers);
    }
    // document.querySelectorでエディタの背景色を適用
    const cmGutters = document.querySelector(".cm-gutters");
    if (cmGutters && backgroundColor) {
      cmGutters.style.backgroundColor = backgroundColor;
      cmGutters.style.borderRightColor = backgroundColor;
    }
    const cmContent = document.querySelector(".cm-content");
    if (cmContent && backgroundColor) {
      cmContent.style.backgroundColor = backgroundColor;
    }
  }, [
    strudelEditorRef,
    currentTheme,
    currentFontSize,
    showLineNumbers,
    showFlash,
    shouldHighlight,
    backgroundColor,
  ]);

  // 初期化時に親コンポーネントにflash設定を通知
  useEffect(() => {
    if (onFlashChange) {
      onFlashChange(showFlash);
    }
  }, [onFlashChange, showFlash]);

  // 初期化時に親コンポーネントにhighlight設定を通知
  useEffect(() => {
    if (onHighlightChange) {
      onHighlightChange(shouldHighlight);
    }
  }, [onHighlightChange, shouldHighlight]);

  return (
    <div className="flex items-center mb-4 gap-4">
      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm normal-case ${
            showLineNumbers ? "btn-info" : "btn-ghost"
          }`}
          onClick={handleLineNumbersToggle}
        >
          行数{showLineNumbers ? "非表示" : "表示"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm normal-case ${
            showFlash ? "btn-info" : "btn-ghost"
          }`}
          onClick={handleFlashToggle}
        >
          Flash{showFlash ? "OFF" : "ON"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`btn btn-sm normal-case ${
            shouldHighlight ? "btn-info" : "btn-ghost"
          }`}
          onClick={handleHighlightToggle}
        >
          Highlight{shouldHighlight ? "OFF" : "ON"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">テーマ:</label>
        <select
          value={currentTheme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="h-10 min-h-10 select select-bordered border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {availableThemes.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">フォントサイズ:</label>
        <select
          value={currentFontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="h-10 min-h-10 select select-bordered border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {availableFontSizes.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">背景色:</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            title="背景色を選択"
          />
          <span className="text-xs text-gray-500">{backgroundColor}</span>
          <button
            type="button"
            className="btn btn-xs btn-outline ml-2 normal-case"
            onClick={handleResetBackgroundColor}
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorControls;
