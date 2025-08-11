import { generateId } from "./utils.js";

/**
 * コード順からブロックを削除する
 * @param {Array} codeOrder - 現在のコード順
 * @param {Object} repeatCounts - 繰り返し回数のデータ
 * @param {string} codeOrderId - 削除するコード順のcodeOrderId
 * @returns {Object} 更新されたデータ { codeOrder, repeatCounts }
 */
export function removeFromRow(codeOrder, repeatCounts, codeOrderId) {
  const newCodeOrder = codeOrder.filter((b) => b.codeOrderId !== codeOrderId);
  const newRepeatCounts = { ...repeatCounts };
  delete newRepeatCounts[codeOrderId];

  return {
    codeOrder: newCodeOrder,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * コード順の小節数入力変更時の処理
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {string} codeOrderId - 対象コード順のcodeOrderId
 * @param {string} value - 入力値
 * @returns {Object} 更新された繰り返し回数データ
 */
export function updateRepeatCount(repeatCounts, codeOrderId, value) {
  return {
    ...repeatCounts,
    [codeOrderId]: value.replace(/[^0-9]/g, ""),
  };
}

import { getCodeListFromJsonData } from "./utils";

/**
 * すべてのコードを一気にコード順に追加（共通コードは除外）
 * @param {Array} codeOrder - 現在のコード順
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {Object} jsonData - JSONデータ
 * @param {Object} commonCodes - 共通コードの状態
 * @returns {Object} 更新されたデータ { codeOrder, repeatCounts }
 */
export function addAllToRow(codeOrder, repeatCounts, jsonData, commonCodes) {
  const now = Date.now();
  const codeList = getCodeListFromJsonData(jsonData);
  const nonCommonBlocks = codeList.filter((block) => !commonCodes[block.id]);
  const newBlocks = nonCommonBlocks.map((block, idx) => ({
    id: block.id,
    codeOrderId: `${block.id}_${now}_${idx}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  }));

  const newCodeOrder = [...codeOrder, ...newBlocks];
  const newRepeatCounts = { ...repeatCounts };
  newBlocks.forEach((b) => {
    newRepeatCounts[b.codeOrderId] = "";
  });

  return {
    codeOrder: newCodeOrder,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * コード順の並び替え・DnDドロップ時の処理
 * @param {Array} codeOrder - 現在のコード順
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {Object} jsonData - JSONデータ
 * @param {string} activeId - アクティブなアイテムのID
 * @param {string} overId - ドロップ先のID
 * @param {Function} arrayMove - arrayMove関数
 * @returns {Object} 更新されたデータ { codeOrder, repeatCounts }
 */
export function codeOrderDragEnd(
  codeOrder,
  repeatCounts,
  jsonData,
  activeId,
  overId,
  arrayMove
) {
  if (!overId || activeId === overId) {
    return { codeOrder: codeOrder, repeatCounts };
  }

  const oldIndex = codeOrder.findIndex((b) => b.codeOrderId === activeId);
  const newIndex = codeOrder.findIndex((b) => b.codeOrderId === overId);

  if (oldIndex !== -1 && newIndex !== -1) {
    // コード順内での並び替え
    const newCodeOrder = arrayMove(codeOrder, oldIndex, newIndex);

    return {
      codeOrder: newCodeOrder,
      repeatCounts,
    };
  } else {
    // 右側からコード順へ
    const blockData = jsonData[activeId];
    if (!blockData) {
      return { codeOrder: codeOrder, repeatCounts };
    }

    const codeOrderId = `${activeId}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const insertIdx = newIndex !== -1 ? newIndex : codeOrder.length;
    const newCodeOrder = [...codeOrder];
    newCodeOrder.splice(insertIdx, 0, { id: activeId, codeOrderId });

    const newRepeatCounts = { ...repeatCounts, [codeOrderId]: "" };

    return {
      codeOrder: newCodeOrder,
      repeatCounts: newRepeatCounts,
    };
  }
}

/**
 * コード一覧からコード順にブロックを追加する
 * @param {Array} codeOrder - 現在のコード順
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {string} id - 追加するコードのID
 * @param {string} code - 追加するコードの内容
 * @param {string} selectedCodeOrderId - 選択中のコード順ID
 * @returns {Object} 更新されたデータ { codeOrder, repeatCounts }
 */
export function addBlockToCodeOrder(
  codeOrder,
  repeatCounts,
  id,
  selectedCodeOrderId
) {
  // 追加位置: 選択中コード順ブロックの次
  let insertIdx = codeOrder.length;
  if (selectedCodeOrderId) {
    const idx = codeOrder.findIndex(
      (b) => b.codeOrderId === selectedCodeOrderId
    );
    if (idx !== -1) insertIdx = idx + 1;
  }

  const codeOrderId = `${id}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const newCodeOrder = [...codeOrder];
  newCodeOrder.splice(insertIdx, 0, { id, codeOrderId });

  const newRepeatCounts = { ...repeatCounts, [codeOrderId]: "" };

  return {
    codeOrder: newCodeOrder,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * コード順の全ブロックを削除する
 * @returns {Object} リセットされたデータ { codeOrder, repeatCounts }
 */
export function deleteAllCodes() {
  return {
    codeOrder: [],
    repeatCounts: {},
  };
}

/**
 * コード順の並び替え処理（arrayMoveを使用）
 * @param {Array} codeOrder - 現在のコード順
 * @param {number} oldIndex - 元のインデックス
 * @param {number} newIndex - 新しいインデックス
 * @param {Function} arrayMove - arrayMove関数
 * @returns {Array} 並び替えられたコード順
 */
export function reorderCodeOrder(codeOrder, oldIndex, newIndex, arrayMove) {
  if (oldIndex === -1 || newIndex === -1) {
    return codeOrder;
  }

  return arrayMove(codeOrder, oldIndex, newIndex);
}
