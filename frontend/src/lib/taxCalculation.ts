/**
 * 税込価格計算ユーティリティ
 */

import { Product } from '@/types/product';

export type RoundingMethod = 'floor' | 'ceil' | 'round';

/**
 * 税込価格を計算
 * @param product 商品データ
 * @param roundingMethod 端数処理方法
 * @returns 税込価格
 */
export function calculateTaxIncludedPrice(
  product: Product,
  roundingMethod: RoundingMethod = 'floor'
): number {
  const price = product.price;
  const taxRate = product.taxRate || 10; // デフォルト10%

  // すでに税込価格 → そのまま返す
  if (product.taxDivision === '0') return price;

  // 非課税 → そのまま返す
  if (product.taxDivision === '2') return price;

  // 税抜 → 税込に変換
  const taxIncluded = price * (1 + taxRate / 100);

  switch (roundingMethod) {
    case 'floor': return Math.floor(taxIncluded);
    case 'ceil':  return Math.ceil(taxIncluded);
    case 'round': return Math.round(taxIncluded);
    default:      return Math.floor(taxIncluded);
  }
}

/**
 * 税率ラベルを取得
 * @param taxRate 税率（8 or 10）
 * @returns 税率ラベル
 */
export function getTaxRateLabel(taxRate: number): string {
  return taxRate === 8 ? '軽減税率 8%' : '標準税率 10%';
}

/**
 * 税区分ラベルを取得
 * @param taxDivision 税区分（0:税込, 1:税抜, 2:非課税）
 * @returns 税区分ラベル
 */
export function getTaxDivisionLabel(taxDivision: string): string {
  switch (taxDivision) {
    case '0': return '税込';
    case '1': return '税抜';
    case '2': return '非課税';
    default:  return '税抜';
  }
}
