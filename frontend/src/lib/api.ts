// frontend/src/lib/api.ts

import { Product, Category, Supplier } from '@/types/product';

// ─── 設定 ───
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

// ─── モックデータ（バックエンド不通時のフォールバック用） ───
const MOCK_PRODUCTS: Product[] = [
  {
    productId: 'PRD001',
    productCode: '4901234567890',
    productName: 'オーガニック全粒粉パン',
    price: 480,
    categoryId: 'CAT001',
    categoryName: 'パン・ベーカリー',
    groupCode: 'GRP001',
    description: '国産有機全粒粉100%使用',
    tag: '自社製造',
    maker: '自社製造',
    taxDivision: '1',
    taxRate: 8,
  },
  {
    productId: 'PRD002',
    productCode: '4901234567891',
    productName: '有機豆乳 無調整 1000ml',
    price: 298,
    categoryId: 'CAT002',
    categoryName: '飲料',
    groupCode: 'GRP002',
    description: '有機大豆100%使用の無調整豆乳',
    tag: 'マルサン',
    maker: 'マルサン',
    taxDivision: '1',
    taxRate: 8,
  },
  {
    productId: 'PRD003',
    productCode: '4901234567892',
    productName: 'フェアトレード ダークチョコレート',
    price: 580,
    categoryId: 'CAT003',
    categoryName: 'お菓子',
    groupCode: 'GRP003',
    description: 'カカオ72% オーガニック',
    tag: 'ピープルツリー',
    maker: 'ピープルツリー',
    taxDivision: '1',
    taxRate: 8,
  },
];

// ─── 税率判定ロジック ───
function determineTaxRate(reduceTaxId: string | null | undefined): number {
  // 軽減税率ID判定
  // null/undefined → 標準税率 10%
  // "10000001" → 軽減税率 8%（食料品など）
  // "10000003" → 軽減税率 8%（適用する）
  if (reduceTaxId === '10000001' || reduceTaxId === '10000003') {
    return 8;
  }
  return 10;
}

// ─── スマレジAPIレスポンス → PopMate Product型 変換 ───
function transformSmaregiProduct(p: any): Product {
  const taxRate = determineTaxRate(p.reduceTaxId);
  
  return {
    productId: String(p.productId || ''),
    productCode: String(p.productCode || ''),
    productName: String(p.productName || ''),
    price: Number(p.price) || 0,
    categoryId: String(p.categoryId || ''),
    categoryName: String(p.categoryName || ''),  // バックエンドが結合済みの値
    groupCode: String(p.groupCode || ''),
    description: String(p.description || ''),
    tag: String(p.supplierProductNo || p.tag || ''),
    maker: String(p.groupCode || ''),  // groupCode をメーカーにマッピング
    taxDivision: (String(p.taxDivision || '1') as '0' | '1' | '2'),
    taxRate: taxRate,
  };
}

// ─── API関数 ───

/**
 * スマレジ接続テスト
 */
export async function checkConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/smaregi/status`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return { connected: false, message: `接続失敗: ${e.message}` };
  }
}

/**
 * 全商品を取得（自動ページネーション）
 * - バックエンドが全ページを自動取得して返す
 */
export async function fetchAllProducts(): Promise<{
  products: Product[];
  source: 'smaregi' | 'mock';
}> {
  try {
    console.log('[api] 全商品データ取得中...', `${API_BASE}/api/smaregi/products/all`);

    const res = await fetch(`${API_BASE}/api/smaregi/products/all`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    console.log('[api] レスポンスステータス:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log('[api] レスポンス総件数:', json.total);

    const data = json.data || json;
    const products = Array.isArray(data)
      ? data.map(transformSmaregiProduct)
      : [];

    if (products.length === 0) {
      console.log('[api] スマレジから0件、モックデータを使用');
      return { products: MOCK_PRODUCTS, source: 'mock' };
    }

    return { products, source: 'smaregi' };
  } catch (error: any) {
    console.error('[api] スマレジ接続エラー、モックデータを使用:', error.message);
    return { products: MOCK_PRODUCTS, source: 'mock' };
  }
}

/**
 * 商品一覧を取得（従来のページネーション版、後方互換性のため残す）
 */
export async function fetchProducts(): Promise<{
  products: Product[];
  source: 'smaregi' | 'mock';
}> {
  // 全件取得版を呼び出す
  return fetchAllProducts();
}

/**
 * カテゴリ一覧を取得（ID付き、categoryId順ソート済み）
 */
export async function fetchCategoriesWithId(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/categories`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const json = await res.json();
    const data = json.data || json;
    if (Array.isArray(data)) {
      return data.map((c: any) => ({
        categoryId: String(c.categoryId || ''),
        categoryCode: String(c.categoryCode || ''),
        categoryName: String(c.categoryName || ''),
        level: Number(c.level) || 1,
        parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : undefined,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * カテゴリ一覧を取得（名前のみ、後方互換性のため残す）
 */
export async function fetchCategories(): Promise<string[]> {
  const categories = await fetchCategoriesWithId();
  return categories.map(c => c.categoryName).filter(Boolean);
}

/**
 * 仕入先一覧を取得（スマレジ仕入先マスタから）
 */
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/suppliers`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const json = await res.json();
    const data = json.data || json;
    if (Array.isArray(data)) {
      return data.map((s: any) => ({
        supplierId: String(s.supplierId || ''),
        supplierCode: String(s.supplierCode || ''),
        supplierName: String(s.supplierName || ''),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── 税込価格計算 ───
export type RoundingMethod = 'floor' | 'ceil' | 'round';

/**
 * 税込価格を計算
 */
export function calculateTaxIncludedPrice(
  product: Product,
  roundingMethod: RoundingMethod = 'floor'
): number {
  const price = product.price;
  const taxRate = product.taxRate;

  // すでに税込価格 → そのまま返す
  if (product.taxDivision === '0') {
    return price;
  }

  // 非課税 → そのまま返す
  if (product.taxDivision === '2') {
    return price;
  }

  // 税抜 → 税込に変換
  const taxIncluded = price * (1 + taxRate / 100);

  switch (roundingMethod) {
    case 'floor': return Math.floor(taxIncluded);
    case 'ceil':  return Math.ceil(taxIncluded);
    case 'round': return Math.round(taxIncluded);
    default:      return Math.floor(taxIncluded);
  }
}

// ─── 後方互換性のためのエクスポート ───
// 既存コードが getProducts() や getMockProducts() を呼んでいる場合のため

export async function getProducts(): Promise<Product[]> {
  const { products } = await fetchProducts();
  return products;
}

export function getMockProducts(): Product[] {
  return MOCK_PRODUCTS;
}
