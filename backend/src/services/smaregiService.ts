// backend/src/services/smaregiService.ts

import axios from 'axios';
import type { SmaregiProduct, SmaregiCategory, PaginatedResponse } from '../types/index.js';

// ─── 環境変数 ───
const CLIENT_ID = process.env.SMAREGI_CLIENT_ID!;
const CLIENT_SECRET = process.env.SMAREGI_CLIENT_SECRET!;
const CONTRACT_ID = process.env.SMAREGI_CONTRACT_ID!;

// 本番: id.smaregi.jp / api.smaregi.jp
// サンドボックス: id.smaregi.dev / api.smaregi.dev
const IDP_HOST = process.env.SMAREGI_IDP_HOST || 'https://id.smaregi.dev';
const API_HOST = process.env.SMAREGI_API_HOST || 'https://api.smaregi.dev';

// ─── トークンキャッシュ ───
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Client Credentials Grant でアクセストークンを取得
 * トークンは有効期限内であればキャッシュを再利用する
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそのまま返す（期限の5分前に更新）
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const tokenUrl = `${IDP_HOST}/app/${CONTRACT_ID}/token`;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  console.log('[SmaregiService] トークン取得開始...');
  console.log('[SmaregiService] Token URL:', tokenUrl);

  const response = await axios.post(
    tokenUrl,
    'grant_type=client_credentials&scope=pos.products:read pos.stores:read pos.suppliers:read',
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

  console.log('[SmaregiService] アクセストークンを取得しました');
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

  console.log('[SmaregiService] API Request:', url);

  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params,
  });

  return response;
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

  const response = await smaregiRequest('/products/', queryParams);
  const data = response.data;

  // スマレジAPIのレスポンスを変換
  const products: SmaregiProduct[] = (Array.isArray(data) ? data : []).map((item: any) => ({
    productId: String(item.productId),
    productCode: item.productCode || '',
    productName: item.productName || '',
    price: Number(item.price) || 0,
    taxRate: item.taxRate ? Number(item.taxRate) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    categoryName: item.categoryName || undefined,
    groupCode: item.groupCode || undefined,
    supplierProductNo: item.supplierProductNo || undefined,
    description: item.description || undefined,
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
 * 商品詳細を取得
 */
export async function getProductById(productId: string): Promise<SmaregiProduct | null> {
  try {
    const response = await smaregiRequest(`/products/${productId}`);
    const item = response.data;

    return {
      productId: String(item.productId),
      productCode: item.productCode || '',
      productName: item.productName || '',
      price: Number(item.price) || 0,
      taxRate: item.taxRate ? Number(item.taxRate) : undefined,
      categoryId: item.categoryId ? String(item.categoryId) : undefined,
      categoryName: item.categoryName || undefined,
      groupCode: item.groupCode || undefined,
      supplierProductNo: item.supplierProductNo || undefined,
      description: item.description || undefined,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * カテゴリ一覧を取得
 */
export async function getCategories(): Promise<SmaregiCategory[]> {
  const response = await smaregiRequest('/categories/');
  const data = response.data;

  return (Array.isArray(data) ? data : []).map((item: any) => ({
    categoryId: String(item.categoryId),
    categoryCode: item.categoryCode || '',
    categoryName: item.categoryName || '',
    level: Number(item.level) || 1,
    parentCategoryId: item.parentCategoryId ? String(item.parentCategoryId) : undefined,
  }));
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
