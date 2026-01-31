/**
 * プレースホルダー置換ユーティリティ
 */

import { Product } from '@/types/product';
import { calculateTaxIncludedPrice, RoundingMethod } from './taxCalculation';

/**
 * テキスト内のプレースホルダーを商品データで置換
 * @param text 置換対象のテキスト
 * @param product 商品データ
 * @param roundingMethod 端数処理方法
 * @returns 置換後のテキスト
 */
export function replacePlaceholders(
  text: string,
  product: Product | null,
  roundingMethod: RoundingMethod = 'floor'
): string {
  if (!product || !text) return text;

  const taxIncludedPrice = calculateTaxIncludedPrice(product, roundingMethod);

  const replacements: Record<string, string> = {
    // 商品情報
    '{{productName}}':      product.productName || '',
    '{{productCode}}':      product.productCode || '',
    '{{description}}':      product.description || '',
    
    // 価格情報
    '{{price}}':            `¥${product.price.toLocaleString()}`,
    '{{priceNumber}}':      String(product.price),
    '{{taxIncludedPrice}}': `¥${taxIncludedPrice.toLocaleString()}`,
    '{{taxIncludedPriceNumber}}': String(taxIncludedPrice),
    
    // カテゴリ・メーカー
    '{{category}}':         product.categoryName || '',
    '{{categoryName}}':     product.categoryName || '',
    '{{maker}}':            product.maker || product.groupCode || '',
    '{{groupCode}}':        product.groupCode || '',
    
    // 税情報
    '{{taxRate}}':          `${product.taxRate || 10}%`,
    '{{taxRateNumber}}':    String(product.taxRate || 10),
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

/**
 * テキストにプレースホルダーが含まれているかチェック
 * @param text チェック対象のテキスト
 * @returns プレースホルダーが含まれていればtrue
 */
export function hasPlaceholders(text: string): boolean {
  return /\{\{[a-zA-Z]+\}\}/.test(text);
}

/**
 * 利用可能なプレースホルダー一覧
 */
export const AVAILABLE_PLACEHOLDERS = [
  { key: '{{productName}}', label: '商品名', example: 'スペイン風スープ' },
  { key: '{{productCode}}', label: '商品コード', example: '2000000204086' },
  { key: '{{price}}', label: '税抜価格（円記号付き）', example: '¥408' },
  { key: '{{priceNumber}}', label: '税抜価格（数値のみ）', example: '408' },
  { key: '{{taxIncludedPrice}}', label: '税込価格（円記号付き）', example: '¥440' },
  { key: '{{taxIncludedPriceNumber}}', label: '税込価格（数値のみ）', example: '440' },
  { key: '{{category}}', label: 'カテゴリ', example: '加工食品' },
  { key: '{{maker}}', label: 'メーカー', example: 'エイドキッチン' },
  { key: '{{taxRate}}', label: '税率', example: '8%' },
  { key: '{{description}}', label: '商品説明', example: 'たっぷりのにんにくと...' },
];
