// backend/src/services/smaregiService.ts

import axios from 'axios';
import type { SmaregiProduct, SmaregiCategory, SmaregiSupplier, PaginatedResponse } from '../types/index.js';

// ─── 環境変数 ───
const CLIENT_ID = process.env.SMAREGI_CLIENT_ID!;
const CLIENT_SECRET = process.env.SMAREGI_CLIENT_SECRET!;
const CONTRACT_ID = process.env.SMAREGI_CONTRACT_ID!;

// 本番: id.smaregi.jp / api.smaregi.jp
// サンドボックス: id.smaregi.dev / api.smaregi.dev
const IDP_HOST = process.env.SMAREGI_IDP_HOST || 'https://id.smaregi.dev';
const API_HOST = process.env.SMAREGI_API_HOST || 'https://api.smaregi.dev';

// ─── トークンキャッシュ（これのみキャッシュ） ───
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Client Credentials Grant でアクセストークンを取得
 * トークンは有効期限内であればキャッシュを再利用する
 * 
 * 注意: スコープはスマレジ・デベロッパーズの管理画面で有効化されている必要がある
 * - pos.products:read → 商品・部門(カテゴリ)の参照（必須）
 * - pos.stores:read → 店舗の参照
 * - pos.suppliers:read → 仕入先の参照（有効化されていない場合は除外して再試行）
 * 
 * ※ pos.categories:read は存在しない。部門(カテゴリ)は pos.products:read に含まれる
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそのまま返す（期限の5分前に更新）
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const tokenUrl = `${IDP_HOST}/app/${CONTRACT_ID}/token`;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  console.log('[SmaregiService] トークン取得開始...');

  // まず仕入先スコープ含めて試行
  const scopeWithSuppliers = 'pos.products:read pos.stores:read pos.suppliers:read';
  const scopeBase = 'pos.products:read pos.stores:read';

  let response;
  try {
    response = await axios.post(
      tokenUrl,
      `grant_type=client_credentials&scope=${scopeWithSuppliers}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log('[SmaregiService] トークン取得成功（仕入先スコープ含む）');
  } catch (firstError: any) {
    // 仕入先スコープが無効な場合、基本スコープのみで再試行
    console.warn('[SmaregiService] 仕入先スコープが無効、基本スコープで再試行:', firstError.response?.data?.error_description || firstError.message);
    try {
      response = await axios.post(
        tokenUrl,
        `grant_type=client_credentials&scope=${scopeBase}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log('[SmaregiService] トークン取得成功（基本スコープのみ）');
    } catch (secondError: any) {
      console.error('[SmaregiService] トークン取得失敗:', secondError.response?.data || secondError.message);
      throw secondError;
    }
  }

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

  console.log('[SmaregiService] スコープ:', response.data.scope);
  console.log('[SmaregiService] 有効期限:', response.data.expires_in, '秒');

  return cachedToken!;
}

/**
 * スマレジAPIにリクエストを送信する共通関数
 */
async function smaregiRequest(path: string, params?: Record<string, string>): Promise<any> {
  const token = await getAccessToken();
  const url = `${API_HOST}/${CONTRACT_ID}/pos${path}`;

  console.log('[SmaregiService] API Request:', url, params);

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params,
  });

  return response;
}

/**
 * 全ページを自動取得するヘルパー関数
 * x-total-countヘッダーを確認し、1000件ずつ全ページを取得
 */
async function fetchAllPages<T>(
  path: string,
  baseParams: Record<string, string> = {},
  transform: (item: any) => T
): Promise<T[]> {
  const limit = 1000;
  let page = 1;
  let allItems: T[] = [];
  let totalCount = -1; // -1 = 未取得

  while (true) {
    const params = { ...baseParams, limit: String(limit), page: String(page) };
    const response = await smaregiRequest(path, params);
    const data = response.data;

    if (page === 1) {
      totalCount = parseInt(response.headers['x-total-count'] || '0', 10);
      console.log(`[SmaregiService] ${path} 総件数: ${totalCount}`);
    }

    const items = Array.isArray(data) ? data.map(transform) : [];
    allItems = allItems.concat(items);

    console.log(`[SmaregiService] ${path} ページ${page}: ${items.length}件取得 (累計: ${allItems.length}/${totalCount})`);

    // 終了判定
    if (items.length === 0) break;                    // データなし
    if (items.length < limit) break;                  // 最終ページ（limit未満）
    if (totalCount > 0 && allItems.length >= totalCount) break; // 全件取得完了
    if (page >= 100) {                                // 安全弁（10万件超）
      console.warn(`[SmaregiService] ${path}: 100ページ超過のため打ち切り`);
      break;
    }

    page++;
  }

  return allItems;
}

/**
 * カテゴリ一覧を取得（キャッシュなし、毎回最新を取得）
 * categoryId順でソート
 */
export async function getCategories(): Promise<SmaregiCategory[]> {
  console.log('[SmaregiService] カテゴリ一覧を取得中（キャッシュなし）...');

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

  // categoryIdの数値順でソート（APIのsortが効かない場合の保険）
  categories.sort((a, b) => Number(a.categoryId) - Number(b.categoryId));

  console.log('[SmaregiService] カテゴリ取得完了:', categories.length, '件');
  return categories;
}

/**
 * カテゴリIDをキーにしたMapを作成（毎回最新を取得）
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
 * 仕入先一覧を取得（スマレジ仕入先マスタAPIから）
 * pos.suppliers:readスコープが無効な場合は空配列を返す
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
    // pos.suppliers:readスコープが無効な場合、403エラーになるので空配列を返す
    console.warn('[SmaregiService] 仕入先取得失敗（スコープ未有効の可能性）:', error.response?.status, error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * 商品一覧を取得（ページネーション対応、カテゴリ名結合）
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

  // 商品とカテゴリマップを並行取得
  const [response, categoryMap] = await Promise.all([
    smaregiRequest('/products/', queryParams),
    getCategoryMap(),
  ]);

  const data = response.data;

  // スマレジAPIのレスポンスを変換（カテゴリ名と税情報を追加）
  const products: SmaregiProduct[] = (Array.isArray(data) ? data : []).map((item: any) => ({
    productId: String(item.productId),
    productCode: item.productCode || '',
    productName: item.productName || '',
    price: Number(item.price) || 0,
    taxRate: item.taxRate ? Number(item.taxRate) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    // カテゴリ名を結合
    categoryName: categoryMap.get(String(item.categoryId)) || item.categoryName || '',
    groupCode: item.groupCode || undefined,
    supplierProductNo: item.supplierProductNo || undefined,
    description: item.description || undefined,
    // 税関連フィールドをパススルー
    taxDivision: item.taxDivision || '1',
    reduceTaxId: item.reduceTaxId || null,
    useCategoryReduceTax: item.useCategoryReduceTax || '0',
  }));

  // ページネーション情報を取得（ヘッダーから）
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

  // カテゴリマップを先に取得
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
 * 接続テスト（トークン取得が成功するか確認）
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
