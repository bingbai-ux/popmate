import { Product } from '@/types/product';
import { TaxSettings, EditorElement, TextElement } from '@/types/editor';
import { estimateTextCapacity } from './textUtils';

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

/**
 * AI要約APIを呼び出してテキストを省略
 */
async function summarizeText(text: string, maxChars: number): Promise<string> {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, maxChars }),
    });

    if (!response.ok) {
      console.error('Summarize API error:', response.status);
      return text.substring(0, maxChars - 1) + '…';
    }

    const data = await response.json();
    return data.summarized || text.substring(0, maxChars - 1) + '…';
  } catch (error) {
    console.error('Summarize error:', error);
    return text.substring(0, maxChars - 1) + '…';
  }
}

/**
 * 商品説明の要約結果をキャッシュ
 */
const summaryCache = new Map<string, string>();

/**
 * 要素内のプレースホルダーを置換（商品説明の自動AI省略付き）
 */
export async function replaceElementPlaceholdersWithSummarize(
  element: EditorElement,
  product: Product,
  taxSettings: TaxSettings
): Promise<EditorElement> {
  const cloned = JSON.parse(JSON.stringify(element)) as EditorElement;

  if (cloned.type === 'text' && cloned.content) {
    const textElement = cloned as TextElement;
    const hasDescription = textElement.content.includes('{{description}}');

    // 通常のプレースホルダー置換
    textElement.content = replacePlaceholders(textElement.content, product, taxSettings);

    // 商品説明が含まれている場合、テキストボックスに収まるか確認
    if (hasDescription && product.description) {
      const capacity = estimateTextCapacity(
        textElement.size.width,
        textElement.size.height,
        textElement.style.fontSize,
        textElement.style.lineHeight,
        textElement.style.letterSpacing,
        textElement.style.writingMode === 'vertical'
      );

      // テキストが収まらない場合、AI省略を適用
      if (textElement.content.length > capacity.chars) {
        // キャッシュキー: 商品ID + 最大文字数
        const cacheKey = `${product.productId || product.productCode}-${capacity.chars}`;

        if (summaryCache.has(cacheKey)) {
          // キャッシュから取得
          const cachedSummary = summaryCache.get(cacheKey)!;
          textElement.content = textElement.content.replace(product.description, cachedSummary);
        } else {
          // AI省略を実行
          const summarized = await summarizeText(product.description, capacity.chars);
          summaryCache.set(cacheKey, summarized);
          textElement.content = textElement.content.replace(product.description, summarized);
        }
      }
    }
  }

  if (cloned.type === 'barcode' && (cloned as any).settings?.value) {
    (cloned as any).settings.value = replacePlaceholders((cloned as any).settings.value, product, taxSettings);
  }
  if (cloned.type === 'qrcode' && (cloned as any).settings?.value) {
    (cloned as any).settings.value = replacePlaceholders((cloned as any).settings.value, product, taxSettings);
  }

  return cloned;
}

/**
 * 複数の要素を一括でプレースホルダー置換（AI省略付き）
 */
export async function replaceAllElementsWithSummarize(
  elements: EditorElement[],
  product: Product,
  taxSettings: TaxSettings
): Promise<EditorElement[]> {
  return Promise.all(
    elements.map(element => replaceElementPlaceholdersWithSummarize(element, product, taxSettings))
  );
}

/**
 * プレースホルダーと表示列のマッピング
 */
export const PLACEHOLDER_COLUMN_MAP: Record<string, { key: string; label: string }> = {
  '{{productName}}': { key: 'productName', label: '商品名' },
  '{{price}}': { key: 'price', label: '税抜価格' },
  '{{priceNumber}}': { key: 'price', label: '税抜価格' },
  '{{taxIncludedPrice}}': { key: 'taxIncludedPrice', label: '税込価格' },
  '{{taxIncludedPriceNumber}}': { key: 'taxIncludedPrice', label: '税込価格' },
  '{{description}}': { key: 'description', label: '説明' },
  '{{maker}}': { key: 'maker', label: 'メーカー' },
  '{{taxRate}}': { key: 'taxRate', label: '税率' },
  '{{taxRateNumber}}': { key: 'taxRate', label: '税率' },
  '{{category}}': { key: 'category', label: 'カテゴリ' },
  '{{productCode}}': { key: 'productCode', label: '商品コード' },
};

/**
 * 要素群から使用されているプレースホルダーを検出
 */
export function detectUsedPlaceholders(elements: EditorElement[]): string[] {
  const usedPlaceholders = new Set<string>();
  const placeholderRegex = /\{\{[^}]+\}\}/g;

  for (const element of elements) {
    if (element.type === 'text' && element.content) {
      const matches = element.content.match(placeholderRegex);
      if (matches) {
        matches.forEach(m => usedPlaceholders.add(m));
      }
    }
    // バーコード・QRコードも対応
    if ((element as any).settings?.value) {
      const matches = (element as any).settings.value.match(placeholderRegex);
      if (matches) {
        matches.forEach((m: string) => usedPlaceholders.add(m));
      }
    }
  }

  return Array.from(usedPlaceholders);
}

/**
 * 使用されているプレースホルダーから表示すべき列を取得
 */
export function getUsedColumns(elements: EditorElement[]): { key: string; label: string }[] {
  const usedPlaceholders = detectUsedPlaceholders(elements);
  const columnsMap = new Map<string, string>();

  // 常に表示する列
  columnsMap.set('productName', '商品名');

  // 使用されているプレースホルダーに対応する列を追加
  for (const placeholder of usedPlaceholders) {
    const mapping = PLACEHOLDER_COLUMN_MAP[placeholder];
    if (mapping && !columnsMap.has(mapping.key)) {
      columnsMap.set(mapping.key, mapping.label);
    }
  }

  // 税込価格は常に表示（価格関連のプレースホルダーがある場合）
  if (usedPlaceholders.some(p => p.includes('price') || p.includes('Price'))) {
    if (!columnsMap.has('taxIncludedPrice')) {
      columnsMap.set('taxIncludedPrice', '税込価格');
    }
  }

  return Array.from(columnsMap.entries()).map(([key, label]) => ({ key, label }));
}
