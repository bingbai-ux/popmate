/**
 * テキスト処理ユーティリティ
 * - 禁則処理（単語・数字の途切れ防止）
 * - 文字数カウント
 */

/**
 * テキストボックスに収まる推定文字数を計算
 * @param widthMm ボックスの幅（mm）
 * @param heightMm ボックスの高さ（mm）
 * @param fontSizePx フォントサイズ（px）
 * @param lineHeightPercent 行間（%）
 * @param letterSpacingPx 字間（px）
 * @param isVertical 縦書きかどうか
 * @returns 推定文字数と行数
 */
export function estimateTextCapacity(
  widthMm: number,
  heightMm: number,
  fontSizePx: number,
  lineHeightPercent: number = 120,
  letterSpacingPx: number = 0,
  isVertical: boolean = false
): { chars: number; lines: number; charsPerLine: number } {
  // 単位変換: 1px = 1/3.78 mm ≒ 0.2646mm
  const pxToMm = 1 / 3.78;

  // フォントサイズをmmに変換
  const fontSizeMm = fontSizePx * pxToMm;
  const letterSpacingMm = letterSpacingPx * pxToMm;

  // 実際の文字幅（日本語は等幅と仮定）
  const charWidthMm = fontSizeMm + letterSpacingMm;

  // 行の高さ
  const lineHeightMm = fontSizeMm * (lineHeightPercent / 100);

  // 利用可能な幅・高さ（上下左右の余白分を差し引く）
  // テキスト描画では最上部と最下部にフォントサイズの30%程度の余白が生じる
  const usableHeightMm = Math.max(0, heightMm - fontSizeMm * 0.3);
  const usableWidthMm = widthMm;

  let charsPerLine: number;
  let lines: number;

  if (isVertical) {
    // 縦書きの場合
    charsPerLine = Math.floor(usableHeightMm / charWidthMm);
    lines = Math.floor(usableWidthMm / lineHeightMm);
  } else {
    // 横書きの場合
    charsPerLine = Math.floor(usableWidthMm / charWidthMm);
    lines = Math.floor(usableHeightMm / lineHeightMm);
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
 * プレースホルダーを含むテキストの推定表示文字数を計算
 * {{price}} → "¥10,000" (約7文字) のように、実際の表示文字数を推定する
 */
const PLACEHOLDER_ESTIMATED_LENGTHS: Record<string, number> = {
  '{{productName}}': 10,
  '{{productCode}}': 13,
  '{{price}}': 7,
  '{{priceNumber}}': 5,
  '{{taxIncludedPrice}}': 7,
  '{{taxIncludedPriceNumber}}': 5,
  '{{description}}': 30,
  '{{maker}}': 8,
  '{{taxRate}}': 3,
  '{{taxRateNumber}}': 2,
  '{{category}}': 6,
};

export function estimateRenderedLength(content: string): number {
  let text = content;
  for (const [placeholder, length] of Object.entries(PLACEHOLDER_ESTIMATED_LENGTHS)) {
    text = text.replaceAll(placeholder, 'X'.repeat(length));
  }
  return text.length;
}

export function hasPlaceholders(content: string): boolean {
  return /\{\{[a-zA-Z]+\}\}/.test(content);
}

/**
 * 禁則処理を適用したテキストを生成
 * カタカナ語・英単語・数字+単位などが途切れないようにする
 * @param text 元のテキスト
 * @returns 禁則処理適用済みテキスト
 */
export function applyKinsoku(text: string): string {
  if (!text) return text;

  // 分離禁止パターン（正規表現）
  const patterns = [
    // カタカナ連続語を一緒にする: フルーツ、ミューズリー、シード 等
    // ー（長音）・ヴ・中黒（・）も含めてカタカナ語として扱う
    /[ァ-ヶー・ヴ]{2,}/g,
    // 英単語（半角・全角）を一緒にする
    /[a-zA-Zａ-ｚＡ-Ｚ]{2,}/g,
    // 数字と単位を一緒にする: 1500g, 100ml, 50%, ¥1,000 など
    /(\d[\d,]*\.?\d*)\s*(g|kg|mg|ml|L|l|mm|cm|m|%|円|個|本|枚|袋|箱|パック|kcal|cal)/g,
    // 価格表記: ¥100, 100円
    /(¥[\d,]+|[\d,]+円)/g,
  ];

  let result = text;

  // 各パターンにWord Joiner (U+2060)を挿入して分離を防ぐ
  // ブラウザはWord Joinerの位置で改行しない
  patterns.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // 各文字間にWord Joinerを挿入
      return match.split('').join('\u2060');
    });
  });

  return result;
}
