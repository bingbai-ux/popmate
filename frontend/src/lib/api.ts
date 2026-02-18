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
    groupCode: 'Aゆうき八百屋',
    description: '国産有機全粒粉100%使用',
    tag: 'プレスオルタナティブ',
    maker: 'プレスオルタナティブ',
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
    groupCode: 'Bマルサン',
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
    groupCode: 'Cピープルツリー',
    description: 'カカオ72% オーガニック',
    tag: 'ピープルツリー',
    maker: 'ピープルツリー',
    taxDivision: '1',
    taxRate: 8,
  },
];

// ─── 税率判定 ───
// reduceTaxId が設定されている商品はすべて軽減税率8%（食品・飲料等）
// null/undefined の場合は標準税率10%（雑貨・アルコール等）
function determineTaxRate(reduceTaxId: string | null | undefined): number {
  if (reduceTaxId) return 8;
  return 10;
}

// ─── スマレジ → Product型 変換 ───
// ★ メーカー = tag（タグ）  /  仕入先 = groupCode（グループコード）
function transformSmaregiProduct(p: any): Product {
  const taxRate = determineTaxRate(p.reduceTaxId);
  return {
    productId: String(p.productId || ''),
    productCode: String(p.productCode || ''),
    productName: String(p.productName || ''),
    price: Number(p.price) || 0,
    categoryId: String(p.categoryId || ''),
    categoryName: String(p.categoryName || ''),
    groupCode: String(p.groupCode || ''),
    description: String(p.description || '').replace(/\s+/g, ''),
    tag: String(p.tag || ''),
    maker: String(p.tag || ''),               // ★ メーカー = tag
    taxDivision: (String(p.taxDivision || '1') as '0' | '1' | '2'),
    taxRate,
  };
}

// ─── API関数 ───

/** スマレジ接続テスト */
export async function checkConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/smaregi/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return { connected: false, message: `接続失敗: ${e.message}` };
  }
}

/**
 * フィルタ用のメーカー(tag)一覧・仕入先(groupCode)一覧を取得
 * ドロップダウン表示用
 */
export async function fetchProductFilters(): Promise<{
  makers: string[];
  suppliers: string[];
}> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/products/filters`, {
      cache: 'no-store',
    });
    if (!res.ok) return { makers: [], suppliers: [] };

    const json = await res.json();
    const data = json.data || json;
    return {
      makers: Array.isArray(data.makers) ? data.makers : [],
      suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
    };
  } catch {
    return { makers: [], suppliers: [] };
  }
}

/**
 * 条件付き商品検索（検索ファースト用）
 */
export interface SearchFiltersParam {
  keyword?: string;
  categoryIds?: string[];
  groupCodes?: string[];   // 仕入先（グループコード）複数選択
  tags?: string[];          // メーカー（タグ）複数選択
}

// ─── モックデータのフィルタリング ───
function filterMockProducts(filters: SearchFiltersParam): Product[] {
  let products = [...MOCK_PRODUCTS];

  if (filters.keyword) {
    const keywords = filters.keyword.toLowerCase().split(/[\s　]+/).filter(Boolean);
    if (keywords.length > 0) {
      products = products.filter(p => {
        const searchTarget = [
          p.productName,
          p.productCode,
          p.description || '',
          p.maker || '',
          p.tag || '',
          String(p.price || ''),
        ].join(' ').toLowerCase();
        return keywords.every(kw => searchTarget.includes(kw));
      });
    }
  }

  if (filters.groupCodes && filters.groupCodes.length > 0) {
    const gcSet = new Set(filters.groupCodes);
    products = products.filter(p => p.groupCode && gcSet.has(p.groupCode));
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagSet = new Set(filters.tags);
    products = products.filter(p => p.tag && tagSet.has(p.tag));
  }

  return products;
}

export async function searchProducts(filters: SearchFiltersParam): Promise<{
  products: Product[];
  source: 'smaregi' | 'mock';
}> {
  try {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      params.set('category_ids', filters.categoryIds.join(','));
    }
    if (filters.groupCodes && filters.groupCodes.length > 0) {
      params.set('group_codes', filters.groupCodes.join(','));
    }
    if (filters.tags && filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }

    const url = `${API_BASE}/api/smaregi/products/search?${params.toString()}`;
    console.log('[api] 商品検索中...', url);

    const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const json = await res.json();
    console.log('[api] 検索結果:', json.total, '件');

    const data = json.data || json;
    const products = Array.isArray(data) ? data.map(transformSmaregiProduct) : [];

    // フィルタなしで0件 → モックにフォールバック（フィルタ適用済み）
    const noFilters = !filters.keyword && !filters.tags?.length && !filters.groupCodes?.length && !filters.categoryIds?.length;
    if (products.length === 0 && noFilters) {
      return { products: filterMockProducts(filters), source: 'mock' };
    }

    return { products, source: 'smaregi' };
  } catch (error: any) {
    console.error('[api] 商品検索エラー:', error.message);
    // モックデータにもフィルタを適用して返す
    return { products: filterMockProducts(filters), source: 'mock' };
  }
}

/** 全商品取得（後方互換） */
export async function fetchAllProducts() { return searchProducts({}); }
export async function fetchProducts() { return fetchAllProducts(); }

/** カテゴリ一覧（ID付き、categoryId順ソート済み） */
export async function fetchCategoriesWithId(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || json;
    if (!Array.isArray(data)) return [];
    return data.map((c: any) => ({
      categoryId: String(c.categoryId || ''),
      categoryCode: String(c.categoryCode || ''),
      categoryName: String(c.categoryName || ''),
      level: Number(c.level) || 1,
      parentCategoryId: c.parentCategoryId ? String(c.parentCategoryId) : undefined,
    }));
  } catch { return []; }
}

export async function fetchCategories(): Promise<string[]> {
  return (await fetchCategoriesWithId()).map(c => c.categoryName).filter(Boolean);
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/suppliers`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || json;
    if (!Array.isArray(data)) return [];
    return data.map((s: any) => ({
      supplierId: String(s.supplierId || ''),
      supplierCode: String(s.supplierCode || ''),
      supplierName: String(s.supplierName || ''),
    }));
  } catch { return []; }
}

// ─── 税込価格計算 ───
export type RoundingMethod = 'floor' | 'ceil' | 'round';

export function calculateTaxIncludedPrice(product: Product, roundingMethod: RoundingMethod = 'floor'): number {
  const { price, taxRate, taxDivision } = product;
  if (taxDivision === '0' || taxDivision === '2') return price;
  const taxIncluded = price * (1 + taxRate / 100);
  switch (roundingMethod) {
    case 'floor': return Math.floor(taxIncluded);
    case 'ceil':  return Math.ceil(taxIncluded);
    case 'round': return Math.round(taxIncluded);
    default:      return Math.floor(taxIncluded);
  }
}

// ─── 後方互換 ───
export async function getProducts(): Promise<Product[]> {
  return (await fetchProducts()).products;
}
export function getMockProducts(): Product[] { return MOCK_PRODUCTS; }
