/**
 * A4レイアウト計算ロジック
 * テンプレートサイズからA4用紙上のグリッドレイアウトを計算
 */

/**
 * テンプレートサイズ定義（mm）
 */
export interface TemplateSize {
  width: number;   // mm
  height: number;  // mm
  name: string;
}

/**
 * 用紙サイズ定義（mm）
 */
export interface PaperSize {
  width: number;   // mm
  height: number;  // mm
  name: string;
}

/**
 * A4レイアウト計算結果
 */
export interface LayoutResult {
  columns: number;          // 列数
  rows: number;             // 行数
  itemsPerPage: number;     // 1ページあたりの配置数
  totalPages: number;       // 総ページ数
  emptyFrames: number;      // 最終ページの空白フレーム数
  marginX: number;          // 左右余白 (mm)
  marginY: number;          // 上下余白 (mm)
  gapX: number;             // ポップ間の水平間隔 (mm)
  gapY: number;             // ポップ間の垂直間隔 (mm)
}

/**
 * テンプレートサイズからA4上のグリッドレイアウトを計算
 */
export function calculateLayout(
  template: TemplateSize,
  paper: PaperSize,
  totalItems: number,
  options?: {
    gapX?: number;  // ポップ間隔X (mm) デフォルト 0
    gapY?: number;  // ポップ間隔Y (mm) デフォルト 0
    marginX?: number; // 左右余白 (mm) デフォルト: 自動計算
    marginY?: number; // 上下余白 (mm) デフォルト: 自動計算
  }
): LayoutResult {
  const gapX = options?.gapX ?? 0;
  const gapY = options?.gapY ?? 0;

  // 配置可能な列数・行数を計算
  // 列数: (paper.width + gapX) / (template.width + gapX) の切り捨て
  const columns = Math.floor((paper.width + gapX) / (template.width + gapX));
  const rows = Math.floor((paper.height + gapY) / (template.height + gapY));
  const itemsPerPage = columns * rows;

  // 余白を自動計算（中央揃え）
  const usedWidth = columns * template.width + (columns - 1) * gapX;
  const usedHeight = rows * template.height + (rows - 1) * gapY;
  const marginX = options?.marginX ?? (paper.width - usedWidth) / 2;
  const marginY = options?.marginY ?? (paper.height - usedHeight) / 2;

  // 総ページ数と空白フレーム数
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;
  const emptyFrames = totalPages * itemsPerPage - totalItems;

  return {
    columns,
    rows,
    itemsPerPage,
    totalPages,
    emptyFrames,
    marginX,
    marginY,
    gapX,
    gapY,
  };
}

/**
 * 既定のテンプレートサイズ
 */
export const TEMPLATE_SIZES: Record<string, TemplateSize> = {
  'price-pop': { width: 91, height: 55, name: 'プライスポップ' },
  // 今後追加するテンプレート:
  // 'a4-pop': { width: 210, height: 297, name: 'A4 POP' },
  // 'a5-pop': { width: 148, height: 210, name: 'A5 POP' },
  // 'a6-pop': { width: 105, height: 148, name: 'A6 POP' },
};

/**
 * 既定の用紙サイズ
 */
export const PAPER_SIZES: Record<string, PaperSize> = {
  'a4': { width: 210, height: 297, name: 'A4' },
  'a3': { width: 297, height: 420, name: 'A3' },
  'b4': { width: 257, height: 364, name: 'B4' },
  'b5': { width: 182, height: 257, name: 'B5' },
};

/**
 * ★ プライスポップ (91×55mm) を A4 に配置した場合の計算結果:
 *
 *   columns = floor((210 + 0) / (91 + 0)) = floor(2.307) = 2
 *   rows    = floor((297 + 0) / (55 + 0)) = floor(5.4)   = 5
 *   itemsPerPage = 2 × 5 = 10
 *   marginX = (210 - 182) / 2 = 14mm
 *   marginY = (297 - 275) / 2 = 11mm
 *
 *   3商品の場合: totalPages=1, emptyFrames=7
 *   15商品の場合: totalPages=2, emptyFrames=5
 */
