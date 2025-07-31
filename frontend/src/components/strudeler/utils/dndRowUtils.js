import { generateId } from "./utils.js";

/**
 * DnD行からブロックを削除する
 * @param {Array} dndRow - 現在のDnD行
 * @param {Object} repeatCounts - 繰り返し回数のデータ
 * @param {string} rowId - 削除するDnD行のrowId
 * @returns {Object} 更新されたデータ { dndRow, repeatCounts }
 */
export function removeFromRow(dndRow, repeatCounts, rowId) {
  const newDndRow = dndRow.filter((b) => b.rowId !== rowId);
  const newRepeatCounts = { ...repeatCounts };
  delete newRepeatCounts[rowId];

  return {
    dndRow: newDndRow,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * DnD行の小節数入力変更時の処理
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {string} rowId - 対象DnD行のrowId
 * @param {string} value - 入力値
 * @returns {Object} 更新された繰り返し回数データ
 */
export function updateRepeatCount(repeatCounts, rowId, value) {
  return {
    ...repeatCounts,
    [rowId]: value.replace(/[^0-9]/g, ""),
  };
}

/**
 * すべてのコードを一気にDnD行に追加（共通コードは除外）
 * @param {Array} dndRow - 現在のDnD行
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {Array} codeList - コードリスト
 * @param {Object} commonCodes - 共通コードの状態
 * @returns {Object} 更新されたデータ { dndRow, repeatCounts }
 */
export function addAllToRow(dndRow, repeatCounts, codeList, commonCodes) {
  const now = Date.now();
  const nonCommonBlocks = codeList.filter((block) => !commonCodes[block.id]);
  const newBlocks = nonCommonBlocks.map((block, idx) => ({
    ...block,
    rowId: `${block.id}_${now}_${idx}_${Math.random()
      .toString(36)
      .slice(2, 8)}`,
  }));

  const newDndRow = [...dndRow, ...newBlocks];
  const newRepeatCounts = { ...repeatCounts };
  newBlocks.forEach((b) => {
    newRepeatCounts[b.rowId] = "";
  });

  return {
    dndRow: newDndRow,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * DnD行の並び替え・DnDドロップ時の処理
 * @param {Array} dndRow - 現在のDnD行
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {Array} codeList - コードリスト
 * @param {string} activeId - アクティブなアイテムのID
 * @param {string} overId - ドロップ先のID
 * @param {Function} arrayMove - arrayMove関数
 * @returns {Object} 更新されたデータ { dndRow, repeatCounts }
 */
export function handleDndRowDragEnd(
  dndRow,
  repeatCounts,
  codeList,
  activeId,
  overId,
  arrayMove
) {
  if (!overId || activeId === overId) {
    return { dndRow, repeatCounts };
  }

  const oldIndex = dndRow.findIndex((b) => b.rowId === activeId);
  const newIndex = dndRow.findIndex((b) => b.rowId === overId);

  if (oldIndex !== -1 && newIndex !== -1) {
    // DnD行内での並び替え
    const newDndRow = arrayMove(dndRow, oldIndex, newIndex);

    return {
      dndRow: newDndRow,
      repeatCounts,
    };
  } else {
    // 右側からDnD行へ
    const block = codeList.find((b) => b.id === activeId);
    if (!block) {
      return { dndRow, repeatCounts };
    }

    const rowId = `${block.id}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const insertIdx = newIndex !== -1 ? newIndex : dndRow.length;
    const newDndRow = [...dndRow];
    newDndRow.splice(insertIdx, 0, { ...block, rowId });

    const newRepeatCounts = { ...repeatCounts, [rowId]: "" };

    return {
      dndRow: newDndRow,
      repeatCounts: newRepeatCounts,
    };
  }
}

/**
 * コード一覧からDnD行にブロックを追加する
 * @param {Array} dndRow - 現在のDnD行
 * @param {Object} repeatCounts - 現在の繰り返し回数データ
 * @param {string} id - 追加するコードのID
 * @param {string} code - 追加するコードの内容
 * @param {string} selectedDnDRowId - 選択中のDnD行ID
 * @returns {Object} 更新されたデータ { dndRow, repeatCounts }
 */
export function addBlockToDnDRow(
  dndRow,
  repeatCounts,
  id,
  code,
  selectedDnDRowId
) {
  // 追加位置: 選択中DnDブロックの次
  let insertIdx = dndRow.length;
  if (selectedDnDRowId) {
    const idx = dndRow.findIndex((b) => b.rowId === selectedDnDRowId);
    if (idx !== -1) insertIdx = idx + 1;
  }

  const rowId = `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newDndRow = [...dndRow];
  newDndRow.splice(insertIdx, 0, { id, code, rowId });

  const newRepeatCounts = { ...repeatCounts, [rowId]: "" };

  return {
    dndRow: newDndRow,
    repeatCounts: newRepeatCounts,
  };
}

/**
 * DnD行の全ブロックを削除する
 * @returns {Object} リセットされたデータ { dndRow, repeatCounts }
 */
export function deleteAllCodes() {
  return {
    dndRow: [],
    repeatCounts: {},
  };
}

/**
 * DnD行の並び替え処理（arrayMoveを使用）
 * @param {Array} dndRow - 現在のDnD行
 * @param {number} oldIndex - 元のインデックス
 * @param {number} newIndex - 新しいインデックス
 * @param {Function} arrayMove - arrayMove関数
 * @returns {Array} 並び替えられたDnD行
 */
export function reorderDndRow(dndRow, oldIndex, newIndex, arrayMove) {
  if (oldIndex === -1 || newIndex === -1) {
    return dndRow;
  }

  return arrayMove(dndRow, oldIndex, newIndex);
}
