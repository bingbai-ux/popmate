// CSV取込フィールド切り替え機能の型定義

/** 列単位のトグル状態（全商品共通）: true = CSV値を使う / false = Smaregi値を使う */
export type FieldToggleState = {
  [fieldName: string]: boolean;
};

/** CSVから取得した追加フィールド（JANCODEをキーに） */
export type CsvFieldMap = {
  [jancode: string]: {
    [fieldName: string]: string;
  };
};

/** マージ済み商品データ（メモリ上で保持） */
export interface MergedProduct {
  productId: string;
  productCode: string;
  productName: string;
  smaregiFields: {
    price: string | null;
    description: string | null;
  };
  csvFields: {
    [fieldName: string]: string;
  };
}

/** CSVパース結果の1行 */
export interface ParsedCsvRow {
  jancode: string;
  additionalFields: { [fieldName: string]: string };
}

/** JANCODE列として認識する列名 */
export const JANCODE_COLUMN_ALIASES = ['jancode', '商品コード', 'jan', 'ean', 'barcode', 'productcode'];

/** CSVフィールド名の日本語表示マッピング */
export const CSV_FIELD_LABELS: { [key: string]: string } = {
  price: '価格',
  description: '説明文',
  '価格': '価格',
  '説明文': '説明文',
  '説明': '説明文',
  '商品名': '商品名',
  productname: '商品名',
};

/** CSVヘッダ名をフィールド名に正規化 */
export function normalizeFieldName(header: string): string {
  const lower = header.toLowerCase().trim();
  if (lower === 'price' || lower === '価格' || lower === '税抜価格' || lower === '税込価格') return 'price';
  if (lower === 'description' || lower === '説明文' || lower === '説明' || lower === '商品説明') return 'description';
  return header.trim();
}

/** フィールド名の表示ラベルを取得 */
export function getFieldLabel(fieldName: string): string {
  return CSV_FIELD_LABELS[fieldName] || CSV_FIELD_LABELS[fieldName.toLowerCase()] || fieldName;
}
