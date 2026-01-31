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

  // 商品の税区分を確認（0:税込, 1:税抜, 2:非課税）
  const taxDivision = product.taxDivision || '1';
  
  // 商品の税率を使用（スマレジから取得した値、デフォルト10%）
  const productTaxRate = product.taxRate || taxSettings.taxRate;
  
  let taxIncludedPrice: number;
  
  if (taxDivision === '0') {
    // すでに税込価格
    taxIncludedPrice = product.price;
  } else if (taxDivision === '2') {
    // 非課税
    taxIncludedPrice = product.price;
  } else {
    // 税抜価格 → 税込に変換
    taxIncludedPrice = calculateTaxIncludedPrice(
      product.price,
      productTaxRate,
      taxSettings.roundingMode
    );
  }

  const replacements: Record<string, string> = {
    '{{productName}}': product.productName || '',
    '{{price}}': formatPrice(product.price),
    '{{priceNumber}}': formatPriceNumber(product.price),
    '{{taxIncludedPrice}}': formatPrice(taxIncludedPrice),
    '{{taxIncludedPriceNumber}}': formatPriceNumber(taxIncludedPrice),
    '{{description}}': product.description || '',
    '{{maker}}': product.maker || product.groupCode || product.tag || '',
    '{{taxRate}}': `${productTaxRate}%`,
    '{{taxRateNumber}}': String(productTaxRate),
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
