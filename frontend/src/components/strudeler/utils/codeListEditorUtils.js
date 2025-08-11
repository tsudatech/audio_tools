import { generateId } from "./utils.js";

/**
 * JSONファイルを読み込んでデータをセットする
 * @param {Event} e - ファイル選択イベント
 * @returns {Promise<Object>} 読み込み結果 { jsonData, firstCode, firstId }
 */
export function loadJsonFile(e) {
  const file = e.target.files[0];
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);

        // orderが設定されていない場合は追加
        Object.entries(json).forEach(([id, item], index) => {
          if (item.order === undefined) {
            json[id] = { ...item, order: index };
          }
        });

        // 最初のコードを取得
        const sortedEntries = Object.entries(json).sort(
          ([, a], [, b]) => (a.order || 0) - (b.order || 0)
        );
        const firstCode = sortedEntries[0]?.[1]?.code || "";
        const firstId = sortedEntries[0]?.[0] || null;

        resolve({
          jsonData: json,
          firstCode,
          firstId,
        });
      } catch (err) {
        alert("Invalid JSON file");
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}

/**
 * エディタの内容変更時にJSONデータを更新する
 * @param {string} value - エディタの新しい内容
 * @param {string} selectedCodeId - 選択中のコードID
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { jsonData }
 */
export function updateCodeFromEditor(value, selectedCodeId, jsonData) {
  // selectedCodeIdが存在するかチェック
  if (!selectedCodeId || !jsonData[selectedCodeId]) {
    return { jsonData };
  }

  // jsonData更新
  const newJsonData = {
    ...jsonData,
    [selectedCodeId]: {
      ...jsonData[selectedCodeId],
      code: value,
    },
  };

  return {
    jsonData: newJsonData,
  };
}

/**
 * 選択されたコードを削除する
 * @param {string} selectedCodeId - 削除するコードのID
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { jsonData, selectedCodeId }
 */
export function deleteSelectedCode(selectedCodeId, jsonData) {
  if (!selectedCodeId || !jsonData[selectedCodeId]) {
    return { jsonData, selectedCodeId: null };
  }

  // jsonDataから削除
  const newJsonData = { ...jsonData };
  delete newJsonData[selectedCodeId];

  return {
    jsonData: newJsonData,
    selectedCodeId: null,
  };
}

/**
 * 選択中のコードを複製する
 * @param {string} selectedCodeId - 複製元のコードID
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { jsonData, selectedCodeId }
 */
export function duplicateSelectedCode(selectedCodeId, jsonData) {
  if (!selectedCodeId || !jsonData[selectedCodeId]) {
    return { jsonData, selectedCodeId };
  }

  const originalData = jsonData[selectedCodeId];

  // 新しいIDを生成
  const newId = generateId();

  // タイトルに_copyを付与
  let newCode = originalData.code;
  if (/@title\s+(.+)/.test(newCode)) {
    newCode = newCode.replace(
      /(@title\s+)(.+)/,
      (_, p1, p2) => `${p1}${p2}_copy`
    );
  } else {
    newCode = `@title コピー\n` + newCode;
  }

  // jsonDataに新しいコードを追加
  const newJsonData = {
    ...jsonData,
    [newId]: {
      ...originalData,
      code: newCode,
    },
  };

  return {
    jsonData: newJsonData,
    selectedCodeId: newId,
  };
}

/**
 * 新規コードブロックを作成する
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { jsonData, selectedCodeId }
 */
export function createNewCode(jsonData) {
  const newId = generateId();
  const newCode = "/*\n@title 新規コード\n*/\n";

  const newJsonData = {
    ...jsonData,
    [newId]: {
      code: newCode,
    },
  };

  return {
    jsonData: newJsonData,
    selectedCodeId: newId,
  };
}
