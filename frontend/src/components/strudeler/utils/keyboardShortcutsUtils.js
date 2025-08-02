/**
 * キーボードショートカットのハンドラーを作成する
 * @param {Object} handlers - 各種ハンドラー関数
 * @param {Object} state - 現在の状態
 * @param {Object} commonCodeManager - 共通コードマネージャー
 * @returns {Function} キーボードイベントハンドラー
 */
export function createKeyboardShortcutHandler(
  handlers,
  state,
  commonCodeManager
) {
  return function handleKeyDown(event) {
    const { handlePlayCurrentCode, handleStop, handleSelectCode } = handlers;
    const { selectedCode, codeList, selectedCodeId } = state;

    // editorにfocusが当たっている場合は無視
    const activeElement = document.activeElement;
    // CodeMirrorエディタのフォーカス判定
    if (
      activeElement &&
      (activeElement.classList?.contains("cm-content") ||
        activeElement.closest?.(".cm-editor"))
    ) {
      // ctrl + . の場合はhandleStopを呼ぶ
      if (event.ctrlKey && event.key === ".") {
        event.preventDefault();
        handleStop(event);
      }
      return;
    }

    // Ctrl+Enter: 再生
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      handlePlayCurrentCode(event);
    }
    // Ctrl+. : 停止
    if (event.ctrlKey && event.key === ".") {
      event.preventDefault();
      handleStop(event);
    }
    // 上下キー: コード一覧の選択変更
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const currentIndex = codeList.findIndex(
        (item) => item.id === selectedCodeId
      );
      if (currentIndex === -1) return;

      let newIndex;
      if (event.key === "ArrowUp") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : codeList.length - 1;
      } else {
        newIndex = currentIndex < codeList.length - 1 ? currentIndex + 1 : 0;
      }

      const newSelectedItem = codeList[newIndex];
      if (newSelectedItem) {
        handleSelectCode(newSelectedItem.id, newSelectedItem.code);

        // 選択されたアイテムが画面外にある場合はスクロール
        setTimeout(() => {
          const selectedElement = document.querySelector(
            `[data-code-id="${newSelectedItem.id}"]`
          );
          if (selectedElement) {
            selectedElement.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }, 0);
      }
    }
  };
}

/**
 * キーボードショートカットのイベントリスナーを設定する
 * @param {Function} handler - キーボードイベントハンドラー
 * @returns {Function} クリーンアップ関数
 */
export function setupKeyboardShortcuts(handler) {
  document.addEventListener("keydown", handler);
  return () => {
    document.removeEventListener("keydown", handler);
  };
}
