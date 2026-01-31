import { Product } from '@/types/product';
import { TaxSettings, EditorElement } from '@/types/editor';

/**
 * 税込価格を計算
 */
export function calculateTaxIncludedPrice(
  price: number,
  taxRate: number,
  roundingMode: 'round' | 'floor' | 'ceil'
): number {
  const taxIncluded = price * (1 + taxRate / 100);
  switch (roundingMode) {
    case 'round': return Math.round(taxIncluded);
    case 'floor': return Math.floor(taxIncluded);
    case 'ceil':  return Math.ceil(taxIncluded);
    default:      return Math.floor(taxIncluded);
  }
}

/**
 * 価格をフォーマット（¥付き）
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price);
}

/**
 * 価格を数値フォーマット（¥なし）
 */
export function formatPriceNumber(price: number): string {
  return new Intl.NumberFormat('ja-JP').format(price);
}

/**
 * プレースホルダーを商品データで置換
 */
export function replacePlaceholders(
  text: string,
  product: Product,
  taxSettings: TaxSettings
): string {
  if (!text) return text;

  const taxIncludedPrice = calculateTaxIncludedPrice(
    product.price,
    taxSettings.taxRate,
    taxSettings.roundingMode
  );

  const replacements: Record<string, string> = {
    '{{productName}}': product.productName || '',
    '{{price}}': formatPrice(product.price),
    '{{priceNumber}}': formatPriceNumber(product.price),
    '{{taxIncludedPrice}}': formatPrice(taxIncludedPrice),
    '{{taxIncludedPriceNumber}}': formatPriceNumber(taxIncludedPrice),
    '{{description}}': product.description || '',
    '{{maker}}': product.tag || '',
    '{{category}}': product.categoryName || '',
    '{{productCode}}': product.productCode || '',
  };

  let result = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

/**
 * 要素内のプレースホルダーを置換（ディープコピー）
 */
export function replaceElementPlaceholders(
  element: EditorElement,
  product: Product,
  taxSettings: TaxSettings
): EditorElement {
  const cloned = JSON.parse(JSON.stringify(element));

  if (cloned.type === 'text' && cloned.content) {
    cloned.content = replacePlaceholders(cloned.content, product, taxSettings);
  }
  if (cloned.type === 'barcode' && cloned.settings?.value) {
    cloned.settings.value = replacePlaceholders(cloned.settings.value, product, taxSettings);
  }
  if (cloned.type === 'qrcode' && cloned.settings?.value) {
    cloned.settings.value = replacePlaceholders(cloned.settings.value, product, taxSettings);
  }
  return cloned;
}
