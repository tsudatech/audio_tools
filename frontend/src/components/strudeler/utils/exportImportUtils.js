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
 * コード順をエクスポートする
 * @param {Array} dndRow - コード順のデータ
 * @param {Object} repeatCounts - 繰り返し回数のデータ
 */
export function exportCodesRowOrder(dndRow, repeatCounts) {
  if (dndRow.length === 0) {
    alert("エクスポートするコード順がありません");
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
 * コード順をインポートする
 * @param {Event} e - ファイル選択イベント
 * @param {Object} jsonData - JSONデータ
 * @returns {Object} インポート結果 { dndRow, repeatCounts }
 */
export function importCodesRowOrder(e, jsonData) {
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

        // インポートしたデータをDnD行に変換
        const newDndRow = importData.codesRow
          .map((item, index) => {
            // jsonDataにidが存在するかチェック
            if (!jsonData[item.id]) {
              // idが見つからない場合はスキップ
              return null;
            }

            return {
              id: item.id,
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

// jsonDataをIndexedDBに保存
export function saveJsonDataToIndexedDB(jsonData) {
  const request = window.indexedDB.open("StrudelerDB", 1);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("jsonDataStore")) {
      db.createObjectStore("jsonDataStore");
    }
  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    const tx = db.transaction("jsonDataStore", "readwrite");
    const store = tx.objectStore("jsonDataStore");
    store.put(jsonData, "jsonData");
    tx.oncomplete = function () {
      db.close();
      // alert("jsonDataをIndexedDBに保存しました");
    };
  };

  request.onerror = function () {
    alert("IndexedDBの保存に失敗しました");
  };
}

// IndexedDBからjsonDataを読込
export function loadJsonDataFromIndexedDB(callback) {
  const request = window.indexedDB.open("StrudelerDB", 1);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("jsonDataStore")) {
      db.createObjectStore("jsonDataStore");
    }
  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    // ストアが存在しない場合は空データを返す
    if (!db.objectStoreNames.contains("jsonDataStore")) {
      callback(null);
      db.close();
      return;
    }
    const tx = db.transaction("jsonDataStore", "readonly");
    const store = tx.objectStore("jsonDataStore");
    const getRequest = store.get("jsonData");
    getRequest.onsuccess = function () {
      callback(getRequest.result);
      db.close();
    };
    getRequest.onerror = function () {
      alert("IndexedDBからの読込に失敗しました");
      db.close();
    };
  };

  request.onerror = function () {
    alert("IndexedDBの読込に失敗しました");
  };
}
