import type { SmaregiProduct, SmaregiCategory, PaginatedResponse } from '../types/index.js';

const SMAREGI_API_BASE = 'https://api.smaregi.jp';
const SMAREGI_AUTH_URL = 'https://id.smaregi.jp/authorize';
const SMAREGI_TOKEN_URL = 'https://id.smaregi.jp/access_token';

interface SmaregiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SmaregiApiConfig {
  contractId: string;
  accessToken: string;
}

interface SmaregiProductRaw {
  productId: string;
  productCode?: string;
  productName?: string;
  price?: number;
  taxRate?: number;
  categoryId?: string;
  categoryName?: string;
  groupCode?: string;
  supplierProductNo?: string;
  description?: string;
}

interface SmaregiCategoryRaw {
  categoryId: string;
  categoryCode?: string;
  categoryName?: string;
  level?: number;
  parentCategoryId?: string;
}

/**
 * スマレジ認証URLを生成
 */
export function generateAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.SMAREGI_CLIENT_ID;
  if (!clientId) {
    throw new Error('SMAREGI_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid pos.products:read pos.categories:read',
    state: state
  });

  return `${SMAREGI_AUTH_URL}?${params.toString()}`;
}

/**
 * 認証コードからアクセストークンを取得
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<SmaregiTokenResponse> {
  const clientId = process.env.SMAREGI_CLIENT_ID;
  const clientSecret = process.env.SMAREGI_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Smaregi credentials are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(SMAREGI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('=== Smaregi Token Error ===', { status: response.status, error });
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data = await response.json() as SmaregiTokenResponse;
  return data;
}

/**
 * 商品一覧を取得
 */
export async function getProducts(
  config: SmaregiApiConfig,
  params: {
    keyword?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<SmaregiProduct>> {
  const { contractId, accessToken } = config;
  const { keyword, categoryId, page = 1, limit = 100 } = params;

  console.log('=== Smaregi getProducts ===', { contractId, keyword, categoryId, page, limit });

  const queryParams = new URLSearchParams({
    limit: String(limit),
    page: String(page)
  });

  if (keyword) {
    queryParams.append('product_name', keyword);
  }
  if (categoryId) {
    queryParams.append('category_id', categoryId);
  }

  const url = `${SMAREGI_API_BASE}/${contractId}/pos/products?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('=== Smaregi API Error ===', { status: response.status, error });
    throw new Error(`Smaregi API error: ${response.status}`);
  }

  const data = await response.json() as SmaregiProductRaw[];
  
  // スマレジAPIのレスポンスを変換
  const products: SmaregiProduct[] = data.map((item) => ({
    productId: String(item.productId),
    productCode: item.productCode || '',
    productName: item.productName || '',
    price: Number(item.price) || 0,
    taxRate: item.taxRate ? Number(item.taxRate) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    categoryName: item.categoryName || undefined,
    groupCode: item.groupCode || undefined,
    supplierProductNo: item.supplierProductNo || undefined,
    description: item.description || undefined
  }));

  // ページネーション情報を取得（ヘッダーから）
  const totalCount = parseInt(response.headers.get('X-Total-Count') || '0', 10);
  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: products,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages
    }
  };
}

/**
 * カテゴリ一覧を取得
 */
export async function getCategories(
  config: SmaregiApiConfig
): Promise<SmaregiCategory[]> {
  const { contractId, accessToken } = config;

  console.log('=== Smaregi getCategories ===', { contractId });

  const url = `${SMAREGI_API_BASE}/${contractId}/pos/categories`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('=== Smaregi API Error ===', { status: response.status, error });
    throw new Error(`Smaregi API error: ${response.status}`);
  }

  const data = await response.json() as SmaregiCategoryRaw[];

  return data.map((item) => ({
    categoryId: String(item.categoryId),
    categoryCode: item.categoryCode || '',
    categoryName: item.categoryName || '',
    level: Number(item.level) || 1,
    parentCategoryId: item.parentCategoryId ? String(item.parentCategoryId) : undefined
  }));
}

/**
 * 商品詳細を取得
 */
export async function getProductById(
  config: SmaregiApiConfig,
  productId: string
): Promise<SmaregiProduct | null> {
  const { contractId, accessToken } = config;

  console.log('=== Smaregi getProductById ===', { contractId, productId });

  const url = `${SMAREGI_API_BASE}/${contractId}/pos/products/${productId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    console.error('=== Smaregi API Error ===', { status: response.status, error });
    throw new Error(`Smaregi API error: ${response.status}`);
  }

  const item = await response.json() as SmaregiProductRaw;

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
    description: item.description || undefined
  };
}
