/**
 * コードリストをJSON形式でエクスポートする
 * @param {Object} jsonData - エクスポートするJSONデータ
 */
export function exportJson(jsonData) {
  if (Object.keys(jsonData).length === 0) {
    alert("エクスポートするデータがありません");
    return;
  }

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `strudel_codes_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * DnD行の並び順をエクスポートする
 * @param {Array} dndRow - DnD行のデータ
 * @param {Object} repeatCounts - 繰り返し回数のデータ
 */
export function exportCodesRowOrder(dndRow, repeatCounts) {
  if (dndRow.length === 0) {
    alert("エクスポートするDnD行がありません");
    return;
  }

  const exportData = {
    codesRow: dndRow.map((block) => ({
      id: block.id,
      repeatCount: repeatCounts[block.rowId] || "",
    })),
    exportDate: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `codes_row_order_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * DnD行の並び順をインポートする
 * @param {Event} e - ファイル選択イベント
 * @param {Array} codeList - コードリスト
 * @param {Object} jsonData - JSONデータ
 * @returns {Object} インポート結果 { dndRow, repeatCounts }
 */
export function importCodesRowOrder(e, codeList, jsonData) {
  const file = e.target.files[0];
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);
        if (!importData.codesRow || !Array.isArray(importData.codesRow)) {
          alert("無効なファイル形式です");
          reject(new Error("無効なファイル形式です"));
          return;
        }

        // インポートしたデータをDnD行に変換（idからcodeを取得）
        const newDndRow = importData.codesRow
          .map((item, index) => {
            // codeListまたはjsonDataからcodeを取得
            let code = "";
            const codeListItem = codeList.find((c) => c.id === item.id);
            if (codeListItem) {
              code = codeListItem.code;
            } else if (jsonData[item.id] && jsonData[item.id].code) {
              code = jsonData[item.id].code;
            } else {
              // codeが見つからない場合はスキップ
              return null;
            }

            return {
              id: item.id,
              code: code,
              rowId: `${item.id}_${Date.now()}_${index}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            };
          })
          .filter(Boolean); // nullを除外

        // repeatCountsも更新
        const newRepeatCounts = {};
        importData.codesRow.forEach((item, index) => {
          if (newDndRow[index]) {
            newRepeatCounts[newDndRow[index].rowId] = item.repeatCount || "";
          }
        });

        resolve({ dndRow: newDndRow, repeatCounts: newRepeatCounts });
      } catch (err) {
        alert("ファイルの読み込みに失敗しました");
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

/**
 * 全状態をエクスポートする
 * @param {Object} state - エクスポートする状態データ
 */
export function exportAllState(state) {
  const exportData = {
    ...state,
    exportDate: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `strudeler_all_state_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 全状態をインポートする
 * @param {Event} e - ファイル選択イベント
 * @returns {Object} インポート結果
 */
export function importAllState(e) {
  const file = e.target.files[0];
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target.result);
        resolve(importData);
      } catch (err) {
        alert("ファイルの読み込みに失敗しました");
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
