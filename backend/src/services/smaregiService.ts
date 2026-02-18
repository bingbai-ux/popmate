// backend/src/services/smaregiService.ts
// スマレジAPI連携サービス（レート制限対策強化版）

import axios from 'axios';
import type { SmaregiProduct, SmaregiCategory, SmaregiSupplier, PaginatedResponse } from '../types/index.js';
import { smaregiRequestWithRateLimit, smaregiRequestQueue } from '../utils/rateLimiter.js';

// ─── 環境変数 ───
const CLIENT_ID = process.env.SMAREGI_CLIENT_ID!;
const CLIENT_SECRET = process.env.SMAREGI_CLIENT_SECRET!;
const CONTRACT_ID = process.env.SMAREGI_CONTRACT_ID!;

// 本番: id.smaregi.jp / api.smaregi.jp
// サンドボックス: id.smaregi.dev / api.smaregi.dev
const IDP_HOST = process.env.SMAREGI_IDP_HOST || 'https://id.smaregi.dev';
const API_HOST = process.env.SMAREGI_API_HOST || 'https://api.smaregi.dev';

// ─── トークンキャッシュ（メモリ内） ───
interface TokenCache {
  token: string;
  expiresAt: number;
  scopes: string[];
}

let tokenCache: TokenCache | null = null;

/**
 * Client Credentials Grant でアクセストークンを取得
 * トークンは有効期限内であればキャッシュを再利用する
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそのまま返す（期限の5分前に更新）
  if (tokenCache && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.token;
  }

  const tokenUrl = `${IDP_HOST}/app/${CONTRACT_ID}/token`;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  console.log('[SmaregiService] トークン取得開始...');

  // まず仕入先スコープ含めて試行
  const scopeWithSuppliers = 'pos.products:read pos.stores:read pos.suppliers:read';
  const scopeBase = 'pos.products:read pos.stores:read';

  let response;
  let usedScopes: string[];

  try {
    response = await smaregiRequestWithRateLimit(() =>
      axios.post(
        tokenUrl,
        `grant_type=client_credentials&scope=${scopeWithSuppliers}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
    );
    usedScopes = scopeWithSuppliers.split(' ');
    console.log('[SmaregiService] トークン取得成功（仕入先スコープ含む）');
  } catch (firstError: any) {
    // 仕入先スコープが無効な場合、基本スコープのみで再試行
    console.warn('[SmaregiService] 仕入先スコープが無効、基本スコープで再試行:', firstError.response?.data?.error_description || firstError.message);
    try {
      response = await smaregiRequestWithRateLimit(() =>
        axios.post(
          tokenUrl,
          `grant_type=client_credentials&scope=${scopeBase}`,
          {
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
      );
      usedScopes = scopeBase.split(' ');
      console.log('[SmaregiService] トークン取得成功（基本スコープのみ）');
    } catch (secondError: any) {
      console.error('[SmaregiService] トークン取得失敗:', secondError.response?.data || secondError.message);
      throw secondError;
    }
  }

  // キャッシュを更新
  tokenCache = {
    token: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000,
    scopes: usedScopes,
  };

  console.log('[SmaregiService] スコープ:', response.data.scope);
  console.log('[SmaregiService] 有効期限:', response.data.expires_in, '秒');

  return tokenCache.token;
}

/**
 * スマレジAPIにリクエストを送信する共通関数（レート制限対策付き）
 */
async function smaregiRequest(path: string, params?: Record<string, string>): Promise<any> {
  const token = await getAccessToken();
  const url = `${API_HOST}/${CONTRACT_ID}/pos${path}`;

  console.log('[SmaregiService] API Request:', url, params);
  console.log('[SmaregiService] Queue状態:', {
    active: smaregiRequestQueue.getActiveRequests(),
    queued: smaregiRequestQueue.getQueueLength(),
  });

  const response = await smaregiRequestWithRateLimit(() =>
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params,
      timeout: 30000, // 30秒タイムアウト
    })
  );

  return response;
}

/**
 * 全ページを自動取得するヘルパー関数
 * x-total-countヘッダーを確認し、1000件ずつ全ページを取得
 *
 * メモリ対策: ジェネレータ版も用意（fetchAllPagesGenerator）
 */
async function fetchAllPages<T>(
  path: string,
  baseParams: Record<string, string> = {},
  transform: (item: any) => T
): Promise<T[]> {
  const limit = 1000;
  let page = 1;
  let allItems: T[] = [];
  let totalCount = -1;

  while (true) {
    const params = { ...baseParams, limit: String(limit), page: String(page) };
    const response = await smaregiRequest(path, params);
    const data = response.data;

    if (page === 1) {
      totalCount = parseInt(response.headers['x-total-count'] || '0', 10);
      console.log(`[SmaregiService] ${path} 総件数: ${totalCount}`);

      // 大量データの警告
      if (totalCount > 10000) {
        console.warn(`[SmaregiService] ⚠️ 大量データ警告: ${totalCount}件の取得が必要です`);
      }
    }

    const items = Array.isArray(data) ? data.map(transform) : [];
    allItems = allItems.concat(items);

    console.log(`[SmaregiService] ${path} ページ${page}: ${items.length}件取得 (累計: ${allItems.length}/${totalCount})`);

    // 終了判定
    if (items.length === 0) break;
    if (items.length < limit) break;
    if (totalCount > 0 && allItems.length >= totalCount) break;
    if (page >= 100) {
      console.warn(`[SmaregiService] ${path}: 100ページ超過のため打ち切り`);
      break;
    }

    page++;
  }

  return allItems;
}

/**
 * ページネーション対応の商品取得（ストリーミング対応版）
 * メモリ効率を重視して1ページずつ処理
 */
export async function* fetchProductsGenerator(
  baseParams: Record<string, string> = {},
  transform: (item: any) => SmaregiProduct
): AsyncGenerator<SmaregiProduct[], void, unknown> {
  const limit = 1000;
  let page = 1;
  let totalCount = -1;
  let fetchedCount = 0;

  while (true) {
    const params = { ...baseParams, limit: String(limit), page: String(page) };
    const response = await smaregiRequest('/products/', params);
    const data = response.data;

    if (page === 1) {
      totalCount = parseInt(response.headers['x-total-count'] || '0', 10);
      console.log(`[SmaregiService] 商品ストリーミング開始: 総件数 ${totalCount}`);
    }

    const items = Array.isArray(data) ? data.map(transform) : [];
    fetchedCount += items.length;

    console.log(`[SmaregiService] ページ${page}: ${items.length}件 (累計: ${fetchedCount}/${totalCount})`);

    if (items.length > 0) {
      yield items; // 1ページ分をyield
    }

    // 終了判定
    if (items.length === 0) break;
    if (items.length < limit) break;
    if (totalCount > 0 && fetchedCount >= totalCount) break;
    if (page >= 100) break;

    page++;
  }
}

/**
 * カテゴリ一覧を取得
 */
export async function getCategories(): Promise<SmaregiCategory[]> {
  console.log('[SmaregiService] カテゴリ一覧を取得中...');

  const categories = await fetchAllPages<SmaregiCategory>(
    '/categories/',
    { sort: 'categoryId:asc' },
    (item: any) => ({
      categoryId: String(item.categoryId),
      categoryCode: item.categoryCode || '',
      categoryName: item.categoryName || '',
      level: Number(item.level) || 1,
      parentCategoryId: item.parentCategoryId ? String(item.parentCategoryId) : undefined,
    })
  );

  categories.sort((a, b) => Number(a.categoryId) - Number(b.categoryId));

  console.log('[SmaregiService] カテゴリ取得完了:', categories.length, '件');
  return categories;
}

/**
 * カテゴリIDをキーにしたMapを作成
 */
async function getCategoryMap(): Promise<Map<string, string>> {
  const categories = await getCategories();
  const map = new Map<string, string>();
  categories.forEach((cat) => {
    map.set(cat.categoryId, cat.categoryName);
  });
  return map;
}

/**
 * 仕入先一覧を取得
 */
export async function getSuppliers(): Promise<SmaregiSupplier[]> {
  console.log('[SmaregiService] 仕入先一覧を取得中...');

  try {
    const suppliers = await fetchAllPages<SmaregiSupplier>(
      '/suppliers/',
      {},
      (item: any) => ({
        supplierId: String(item.supplierId),
        supplierCode: item.supplierCode || '',
        supplierName: item.supplierName || '',
      })
    );

    console.log('[SmaregiService] 仕入先取得完了:', suppliers.length, '件');
    return suppliers;
  } catch (error: any) {
    console.warn('[SmaregiService] 仕入先取得失敗（スコープ未有効の可能性）:', error.response?.status, error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * 商品一覧を取得（ページネーション対応）
 */
export async function getProducts(
  page: number = 1,
  limit: number = 100,
  params: {
    keyword?: string;
    categoryId?: string;
  } = {}
): Promise<PaginatedResponse<SmaregiProduct>> {
  const queryParams: Record<string, string> = {
    limit: String(limit),
    page: String(page),
  };

  if (params.keyword) {
    queryParams['product_name'] = params.keyword;
  }
  if (params.categoryId) {
    queryParams['category_id'] = params.categoryId;
  }

  const [response, categoryMap] = await Promise.all([
    smaregiRequest('/products/', queryParams),
    getCategoryMap(),
  ]);

  const data = response.data;

  const products: SmaregiProduct[] = (Array.isArray(data) ? data : []).map((item: any) => ({
    productId: String(item.productId),
    productCode: item.productCode || '',
    productName: item.productName || '',
    price: Number(item.price) || 0,
    taxRate: item.taxRate ? Number(item.taxRate) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    categoryName: categoryMap.get(String(item.categoryId)) || item.categoryName || '',
    groupCode: item.groupCode || undefined,
    tag: item.tag || undefined,
    supplierProductNo: item.supplierProductNo || undefined,
    description: item.description || undefined,
    taxDivision: item.taxDivision || '1',
    reduceTaxId: item.reduceTaxId || null,
    useCategoryReduceTax: item.useCategoryReduceTax || '0',
  }));

  const totalCount = parseInt(response.headers['x-total-count'] || '0', 10);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    success: true,
    data: products,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * 全商品を取得（自動ページネーション）
 */
export async function getAllProducts(): Promise<SmaregiProduct[]> {
  console.log('[SmaregiService] 全商品を取得中（自動ページネーション）...');

  const categoryMap = await getCategoryMap();

  const products = await fetchAllPages<SmaregiProduct>(
    '/products/',
    {},
    (item: any) => ({
      productId: String(item.productId),
      productCode: item.productCode || '',
      productName: item.productName || '',
      price: Number(item.price) || 0,
      taxRate: item.taxRate ? Number(item.taxRate) : undefined,
      categoryId: item.categoryId ? String(item.categoryId) : undefined,
      categoryName: categoryMap.get(String(item.categoryId)) || item.categoryName || '',
      groupCode: item.groupCode || undefined,
      tag: item.tag || undefined,
      supplierProductNo: item.supplierProductNo || undefined,
      description: item.description || undefined,
      taxDivision: item.taxDivision || '1',
      reduceTaxId: item.reduceTaxId || null,
      useCategoryReduceTax: item.useCategoryReduceTax || '0',
    })
  );

  console.log('[SmaregiService] 全商品取得完了:', products.length, '件');
  return products;
}

/**
 * 商品フィルタ用のメーカー(tag)一覧・仕入先(groupCode)一覧を取得
 * 5分間キャッシュ
 */
interface FiltersCache {
  makers: string[];
  suppliers: string[];
  expiresAt: number;
}

let filtersCache: FiltersCache | null = null;

export async function getProductFilters(): Promise<{ makers: string[]; suppliers: string[] }> {
  // キャッシュが有効ならそのまま返す
  if (filtersCache && Date.now() < filtersCache.expiresAt) {
    console.log('[SmaregiService] フィルタキャッシュ使用');
    return { makers: filtersCache.makers, suppliers: filtersCache.suppliers };
  }

  console.log('[SmaregiService] フィルタ一覧を取得中（全商品走査）...');

  const makersSet = new Set<string>();
  const suppliersSet = new Set<string>();

  await fetchAllPages<void>(
    '/products/',
    {},
    (item: any) => {
      if (item.tag) makersSet.add(item.tag);
      if (item.groupCode) suppliersSet.add(item.groupCode);
    }
  );

  const makers = [...makersSet].sort((a, b) => a.localeCompare(b, 'ja'));
  const suppliers = [...suppliersSet].sort((a, b) => a.localeCompare(b, 'ja'));

  filtersCache = {
    makers,
    suppliers,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5分キャッシュ
  };

  console.log(`[SmaregiService] フィルタ取得完了: メーカー${makers.length}件, 仕入先${suppliers.length}件`);
  return { makers, suppliers };
}

/**
 * 条件付き商品検索
 */
export async function searchProducts(params: {
  keyword?: string;
  categoryIds?: string[];
  groupCodes?: string[];
  tags?: string[];
} = {}): Promise<SmaregiProduct[]> {
  console.log('[SmaregiService] 商品検索:', params);

  const categoryMap = await getCategoryMap();

  const baseParams: Record<string, string> = {};
  if (params.keyword) {
    // スペース区切りの場合、最も長いキーワードをSmaregi APIに送信
    // （API側では productName の部分一致検索のみ対応のため）
    const keywords = params.keyword.split(/[\s　]+/).filter(Boolean);
    const longestKeyword = keywords.reduce((a, b) => a.length >= b.length ? a : b, '');
    baseParams['productName'] = longestKeyword;
  }

  const transformProduct = (item: any): SmaregiProduct => ({
    productId: String(item.productId),
    productCode: item.productCode || '',
    productName: item.productName || '',
    price: Number(item.price) || 0,
    taxRate: item.taxRate ? Number(item.taxRate) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    categoryName: categoryMap.get(String(item.categoryId)) || item.categoryName || '',
    groupCode: item.groupCode || undefined,
    tag: item.tag || undefined,
    supplierProductNo: item.supplierProductNo || undefined,
    description: item.description || undefined,
    taxDivision: item.taxDivision || '1',
    reduceTaxId: item.reduceTaxId || null,
    useCategoryReduceTax: item.useCategoryReduceTax || '0',
  });

  let products: SmaregiProduct[];

  // カテゴリが選択されている場合: カテゴリごとに並列取得→マージ
  if (params.categoryIds && params.categoryIds.length > 0) {
    const results = await Promise.all(
      params.categoryIds.map(catId =>
        fetchAllPages<SmaregiProduct>(
          '/products/',
          { ...baseParams, categoryId: catId },
          transformProduct
        )
      )
    );
    const seen = new Set<string>();
    products = results.flat().filter(p => {
      if (seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });
  } else {
    products = await fetchAllPages<SmaregiProduct>(
      '/products/',
      baseParams,
      transformProduct
    );
  }

  // サーバーサイドフィルタ（部分一致: スペース区切りで全キーワードにマッチ）
  if (params.keyword) {
    // スペース（全角・半角）で分割し、空文字を除去
    const keywords = params.keyword.toLowerCase().split(/[\s　]+/).filter(Boolean);
    if (keywords.length > 0) {
      products = products.filter(p => {
        // 検索対象フィールドを結合
        const searchTarget = [
          p.productName,
          p.productCode,
          p.description || '',
          p.tag || '',           // メーカー
          String(p.price || ''), // 価格
        ].join(' ').toLowerCase();
        // 全キーワードが含まれていればマッチ（AND検索）
        return keywords.every(kw => searchTarget.includes(kw));
      });
    }
  }
  if (params.groupCodes && params.groupCodes.length > 0) {
    const gcSet = new Set(params.groupCodes);
    products = products.filter(p => p.groupCode && gcSet.has(p.groupCode));
  }
  if (params.tags && params.tags.length > 0) {
    const tagSet = new Set(params.tags);
    products = products.filter(p => p.tag && tagSet.has(p.tag));
  }

  console.log('[SmaregiService] 検索結果:', products.length, '件');
  return products;
}

/**
 * 商品詳細を取得
 */
export async function getProductById(productId: string): Promise<SmaregiProduct | null> {
  try {
    const [response, categoryMap] = await Promise.all([
      smaregiRequest(`/products/${productId}`),
      getCategoryMap(),
    ]);
    const item = response.data;

    return {
      productId: String(item.productId),
      productCode: item.productCode || '',
      productName: item.productName || '',
      price: Number(item.price) || 0,
      taxRate: item.taxRate ? Number(item.taxRate) : undefined,
      categoryId: item.categoryId ? String(item.categoryId) : undefined,
      categoryName: categoryMap.get(String(item.categoryId)) || item.categoryName || '',
      groupCode: item.groupCode || undefined,
      tag: item.tag || undefined,
      supplierProductNo: item.supplierProductNo || undefined,
      description: item.description || undefined,
      taxDivision: item.taxDivision || '1',
      reduceTaxId: item.reduceTaxId || null,
      useCategoryReduceTax: item.useCategoryReduceTax || '0',
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * 接続テスト
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken();
    return { success: true, message: 'スマレジAPIに接続できました' };
  } catch (error: any) {
    console.error('[SmaregiService] 接続テスト失敗:', error.response?.data || error.message);
    return {
      success: false,
      message: `接続失敗: ${error.response?.data?.error_description || error.message}`,
    };
  }
}

/**
 * キャッシュをクリア（管理用）
 */
export function clearCache(): void {
  tokenCache = null;
  filtersCache = null;
  console.log('[SmaregiService] キャッシュをクリアしました');
}

/**
 * API状態を取得（管理用）
 */
export function getApiStatus(): {
  tokenCached: boolean;
  tokenExpiresIn: number | null;
  filtersCached: boolean;
  filtersExpiresIn: number | null;
  queueActive: number;
  queuePending: number;
} {
  return {
    tokenCached: !!tokenCache,
    tokenExpiresIn: tokenCache ? Math.max(0, Math.floor((tokenCache.expiresAt - Date.now()) / 1000)) : null,
    filtersCached: !!filtersCache,
    filtersExpiresIn: filtersCache ? Math.max(0, Math.floor((filtersCache.expiresAt - Date.now()) / 1000)) : null,
    queueActive: smaregiRequestQueue.getActiveRequests(),
    queuePending: smaregiRequestQueue.getQueueLength(),
  };
}
