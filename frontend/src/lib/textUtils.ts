/**
 * テキスト処理ユーティリティ
 * - 禁則処理（単語・数字の途切れ防止）
 * - 文字数カウント
 */

/**
 * テキストボックスに収まる推定文字数を計算
 * @param widthMm ボックスの幅（mm）
 * @param heightMm ボックスの高さ（mm）
 * @param fontSizePt フォントサイズ（pt）
 * @param lineHeightPercent 行間（%）
 * @param letterSpacingPt 字間（pt）
 * @param isVertical 縦書きかどうか
 * @returns 推定文字数と行数
 */
export function estimateTextCapacity(
  widthMm: number,
  heightMm: number,
  fontSizePt: number,
  lineHeightPercent: number = 120,
  letterSpacingPt: number = 0,
  isVertical: boolean = false
): { chars: number; lines: number; charsPerLine: number } {
  // 単位変換: 1pt ≒ 0.353mm, 1mm ≒ 2.83pt
  const ptToMm = 0.353;

  // フォントサイズをmmに変換
  const fontSizeMm = fontSizePt * ptToMm;
  const letterSpacingMm = letterSpacingPt * ptToMm;

  // 実際の文字幅（日本語は等幅と仮定）
  const charWidthMm = fontSizeMm + letterSpacingMm;

  // 行の高さ
  const lineHeightMm = fontSizeMm * (lineHeightPercent / 100);

  let charsPerLine: number;
  let lines: number;

  if (isVertical) {
    // 縦書きの場合
    charsPerLine = Math.floor(heightMm / charWidthMm);
    lines = Math.floor(widthMm / lineHeightMm);
  } else {
    // 横書きの場合
    charsPerLine = Math.floor(widthMm / charWidthMm);
    lines = Math.floor(heightMm / lineHeightMm);
  }

  // 最低1文字、1行は確保
  charsPerLine = Math.max(1, charsPerLine);
  lines = Math.max(1, lines);

  return {
    chars: charsPerLine * lines,
    lines,
    charsPerLine,
  };
}

/**
 * 禁則処理を適用したテキストを生成
 * 数字と単位、カタカナ連続語などが途切れないようにする
 * @param text 元のテキスト
 * @returns 禁則処理適用済みテキスト
 */
export function applyKinsoku(text: string): string {
  if (!text) return text;

  // 分離禁止パターン（正規表現）
  // 数字+単位（1500g、100ml、50%など）
  const patterns = [
    // 数字と単位を一緒にする: 1500g, 100ml, 50%, ¥1,000 など
    /(\d[\d,]*\.?\d*)\s*(g|kg|mg|ml|L|l|mm|cm|m|%|円|個|本|枚|袋|箱|パック|kcal|cal)/g,
    // 価格表記: ¥100, 100円
    /(¥[\d,]+|[\d,]+円)/g,
  ];

  let result = text;

  // 数字+単位パターンにWord Joiner (U+2060)を挿入して分離を防ぐ
  // ブラウザはWord Joinerの位置で改行しない
  patterns.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // 各文字間にWord Joinerを挿入
      return match.split('').join('\u2060');
    });
  });

  return result;
}
