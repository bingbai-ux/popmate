// frontend/src/lib/api.ts

import { Product } from '@/types/product';

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
  },
];

// ─── スマレジAPIレスポンス → PopMate Product型 変換 ───
function transformSmaregiProduct(p: any): Product {
  return {
    productId: String(p.productId || ''),
    productCode: String(p.productCode || ''),
    productName: String(p.productName || ''),
    price: Number(p.price) || 0,
    categoryId: String(p.categoryId || ''),
    categoryName: String(p.categoryName || ''),
    groupCode: String(p.groupCode || ''),
    description: String(p.description || ''),
    tag: String(p.supplierProductNo || p.tag || ''),
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
 * 商品一覧を取得
 * - まずバックエンド（スマレジ実データ）を試す
 * - 失敗したらモックデータにフォールバック
 */
export async function fetchProducts(): Promise<{
  products: Product[];
  source: 'smaregi' | 'mock';
}> {
  try {
    console.log('[api] 商品データ取得中...', `${API_BASE}/api/smaregi/products`);

    const res = await fetch(`${API_BASE}/api/smaregi/products?limit=1000`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    console.log('[api] レスポンスステータス:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    console.log('[api] レスポンス:', json);

    // バックエンドのレスポンス形式: { success: true, data: [...] }
    const data = json.data || json;
    console.log('[api] 取得データ件数:', Array.isArray(data) ? data.length : 'not array');

    // スマレジAPIのレスポンスは配列
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
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/api/smaregi/categories`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((c: any) => c.categoryName || '').filter(Boolean);
    }
    return [];
  } catch {
    return [];
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
