import { generateId } from "./utils";

/**
 * JSONファイルを読み込んでコードリスト・データをセットする
 * @param {Event} e - ファイル選択イベント
 * @returns {Promise<Object>} 読み込み結果 { jsonData, codes, firstCode, firstId }
 */
export function loadJsonFile(e) {
  const file = e.target.files[0];
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // 添付JSONの形式: { id: { code: '...', ... }, ... }
        const codes = Object.entries(json).map(([id, item]) => ({
          id,
          code: item.code,
        }));

        const firstCode = codes[0]?.code || "";
        const firstId = codes[0]?.id || null;

        resolve({
          jsonData: json,
          codes,
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
 * エディタの内容変更時にコードリストとJSONデータを更新する
 * @param {string} value - エディタの新しい内容
 * @param {string} selectedCodeId - 選択中のコードID
 * @param {Array} codeList - 現在のコードリスト
 * @param {Object} jsonData - 現在のJSONデータ
 * @param {Array} dndRow - 現在のDnD行
 * @returns {Object} 更新されたデータ { codeList, jsonData, dndRow }
 */
export function updateCodeFromEditor(
  value,
  selectedCodeId,
  codeList,
  jsonData,
  dndRow
) {
  // どのidのコードか特定
  const found = codeList.find((item) => item.id === selectedCodeId);
  if (!found) {
    return { codeList, jsonData, dndRow };
  }

  // codeList更新
  const newCodeList = codeList.map((item) =>
    item.id === found.id ? { ...item, code: value } : item
  );

  // jsonData更新
  const newJsonData = {
    ...jsonData,
    [found.id]: {
      ...jsonData[found.id],
      code: value,
    },
  };

  // dndRowの該当コードも更新
  const newDndRow = dndRow.map((item) =>
    item.id === found.id ? { ...item, code: value } : item
  );

  return {
    codeList: newCodeList,
    jsonData: newJsonData,
    dndRow: newDndRow,
  };
}

/**
 * 選択されたコードを削除する
 * @param {string} selectedCodeId - 削除するコードのID
 * @param {Array} codeList - 現在のコードリスト
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { codeList, jsonData, selectedCodeId, selectedCode }
 */
export function deleteSelectedCode(selectedCodeId, codeList, jsonData) {
  if (!selectedCodeId) {
    return { codeList, jsonData, selectedCodeId: null, selectedCode: "" };
  }

  // codeListから削除
  const found = codeList.find((item) => item.id === selectedCodeId);
  if (!found) {
    return { codeList, jsonData, selectedCodeId: null, selectedCode: "" };
  }

  const newCodeList = codeList.filter((item) => item.id !== found.id);

  // jsonDataから削除
  const newJsonData = { ...jsonData };
  delete newJsonData[found.id];

  return {
    codeList: newCodeList,
    jsonData: newJsonData,
    selectedCodeId: null,
    selectedCode: "",
  };
}

/**
 * 選択中のコードを複製する
 * @param {string} selectedCodeId - 複製元のコードID
 * @param {Array} codeList - 現在のコードリスト
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { codeList, jsonData, selectedCodeId, selectedCode }
 */
export function duplicateSelectedCode(selectedCodeId, codeList, jsonData) {
  if (!selectedCodeId) {
    return { codeList, jsonData, selectedCodeId, selectedCode: "" };
  }

  const found = codeList.find((item) => item.id === selectedCodeId);
  if (!found) {
    return { codeList, jsonData, selectedCodeId, selectedCode: "" };
  }

  // 新しいIDを生成
  const newId = generateId();

  // タイトルに_copyを付与
  let newCode = found.code;
  if (/@title\s+(.+)/.test(newCode)) {
    newCode = newCode.replace(
      /(@title\s+)(.+)/,
      (_, p1, p2) => `${p1}${p2}_copy`
    );
  } else {
    newCode = `@title コピー\n` + newCode;
  }

  const newBlock = { id: newId, code: newCode };

  // 複製元の直下に挿入
  const foundIndex = codeList.findIndex((item) => item.id === found.id);
  const newCodeList = [...codeList];
  newCodeList.splice(foundIndex + 1, 0, newBlock);

  // jsonDataの順序も更新
  const newJsonData = {};
  newCodeList.forEach((item) => {
    if (jsonData[item.id]) {
      newJsonData[item.id] = jsonData[item.id];
    }
  });
  newJsonData[newId] = { ...(jsonData[found.id] || {}), code: newCode };

  return {
    codeList: newCodeList,
    jsonData: newJsonData,
    selectedCodeId: newId,
    selectedCode: newCode,
  };
}

/**
 * 新規コードブロックを作成する
 * @param {Array} codeList - 現在のコードリスト
 * @param {Object} jsonData - 現在のJSONデータ
 * @returns {Object} 更新されたデータ { codeList, jsonData, selectedCodeId, selectedCode }
 */
export function createNewCode(codeList, jsonData) {
  const newId = generateId();
  const newCode = "/*\n@title 新規コード\n*/\n";
  const newBlock = { id: newId, code: newCode };

  const newCodeList = [...codeList, newBlock];
  const newJsonData = { ...jsonData, [newId]: { code: newCode } };

  return {
    codeList: newCodeList,
    jsonData: newJsonData,
    selectedCodeId: newId,
    selectedCode: newCode,
  };
}

/**
 * コード一覧のDnD並び替え時の処理
 * @param {Array} codeList - 現在のコードリスト
 * @param {Object} jsonData - 現在のJSONデータ
 * @param {number} oldIndex - 元のインデックス
 * @param {number} newIndex - 新しいインデックス
 * @returns {Object} 更新されたデータ { codeList, jsonData }
 */
export function reorderCodeList(codeList, jsonData, oldIndex, newIndex) {
  if (oldIndex === -1 || newIndex === -1) {
    return { codeList, jsonData };
  }

  // 配列を並び替え
  const newCodeList = [...codeList];
  const [movedItem] = newCodeList.splice(oldIndex, 1);
  newCodeList.splice(newIndex, 0, movedItem);

  // jsonDataの順序もcodeListに合わせて並び替え
  const newJsonData = {};
  newCodeList.forEach((item) => {
    if (jsonData[item.id]) {
      newJsonData[item.id] = jsonData[item.id];
    }
  });

  return {
    codeList: newCodeList,
    jsonData: newJsonData,
  };
}
