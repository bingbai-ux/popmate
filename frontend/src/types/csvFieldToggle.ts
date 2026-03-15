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

/** CSVパース結果の1行 */
export interface ParsedCsvRow {
  jancode: string;
  additionalFields: { [fieldName: string]: string };
}

/** JANCODE列として認識する列名 */
export const JANCODE_COLUMN_ALIASES = ['jancode', '商品コード', 'jan', 'ean', 'barcode', 'productcode'];

/** CSVヘッダ名をフィールド名に正規化 */
export function normalizeFieldName(header: string): string {
  const lower = header.toLowerCase().trim();
  if (lower === 'price' || lower === '価格' || lower === '税抜価格' || lower === '税込価格') return 'price';
  if (lower === 'description' || lower === '説明文' || lower === '説明' || lower === '商品説明') return 'description';
  return header.trim();
}

// ─── 税込価格計算 ───

/** reduceTaxId から税率（小数）を返す */
export function getTaxRate(reduceTaxId: string | null | undefined): number {
  if (reduceTaxId === '10000001') return 0.08; // 軽減税率 8%
  // '10000002'~'10000004' は選択式 → 安全側で標準税率10%
  if (['10000002', '10000003', '10000004'].includes(reduceTaxId ?? '')) {
    console.log('=== 税率選択式商品 ===', { reduceTaxId, '適用税率': '10%（安全側）' });
  }
  return 0.10; // 標準税率 10%
}

/** 税抜価格 → 税込価格（四捨五入） */
export function calcTaxIncludedPrice(
  priceExcluded: number,
  taxRate: number
): number {
  if (isNaN(priceExcluded)) return 0;
  return Math.round(priceExcluded * (1 + taxRate / 100));
}

/** CSV/Smaregi値を切り替えて表示値を決定 */
export function resolveDisplayValue(
  productCode: string,
  smaregiValue: string | number | null,
  fieldName: string,
  csvFieldMap: CsvFieldMap,
  fieldToggleState: FieldToggleState
): { value: string; isFromCsv: boolean } {
  if (!fieldToggleState[fieldName]) {
    return { value: smaregiValue != null ? String(smaregiValue) : '', isFromCsv: false };
  }
  const csvFields = csvFieldMap[productCode];
  if (!csvFields || !csvFields[fieldName]) {
    return { value: smaregiValue != null ? String(smaregiValue) : '', isFromCsv: false };
  }
  return { value: csvFields[fieldName], isFromCsv: true };
}

/** CsvFieldMapに特定フィールドのデータが1件以上あるか */
export function hasCsvField(fieldName: string, csvFieldMap: CsvFieldMap): boolean {
  for (const fields of Object.values(csvFieldMap)) {
    if (fields[fieldName]) return true;
  }
  return false;
}
