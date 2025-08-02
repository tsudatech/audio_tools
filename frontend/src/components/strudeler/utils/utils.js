// ランダムID生成（12桁英数字）
export function generateId(len = 12) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 選択されている共通コードのテキストを取得する
 * @param {Object} params - パラメータ
 * @param {Object} params.commonCodes - 共通コードの状態
 * @param {Array} params.codeList - コードリスト
 * @param {Object} params.jsonData - JSONデータ
 * @returns {string} 共通コードの結合テキスト（60行の改行＋コード本体）
 */
export function getCommonCodeText({ commonCodes, codeList, jsonData }) {
  const commonCodeIds = Object.keys(commonCodes).filter(
    (id) => commonCodes[id]
  );
  if (commonCodeIds.length === 0) return "";

  return commonCodeIds
    .map((id) => {
      const codeListItem = codeList.find((c) => c.id === id);
      return codeListItem ? codeListItem.code : jsonData[id]?.code || "";
    })
    .filter((code) => code)
    .join("\n\n");
}
