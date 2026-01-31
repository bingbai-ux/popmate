// APIクライアント（Client Credentials Grant対応版）

import { Product, Category, ProductSearchParams, ApiResponse, MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

// デフォルトはfalse（スマレジ実データを使用）
// NEXT_PUBLIC_USE_MOCK=true の場合のみモックデータを使用
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// モックデータモードを取得（グローバル状態から）
let useMockData = USE_MOCK;

export function setUseMockData(value: boolean) {
  useMockData = value;
}

export function getUseMockData(): boolean {
  return useMockData;
}

/**
 * スマレジAPIとの接続状態を確認
 */
export async function checkSmaregiConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (useMockData) {
    return { connected: false, message: 'モックデータモードです' };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/smaregi/status`);
    return await res.json();
  } catch {
    return { connected: false, message: 'バックエンドに接続できません' };
  }
}

/**
 * スマレジAPIレスポンスをProduct型にマッピング
 */
function transformSmaregiProduct(item: Record<string, unknown>): Product {
  return {
    productId: String(item.productId || item.product_id || ''),
    productCode: String(item.productCode || item.product_code || ''),
    productName: String(item.productName || item.product_name || ''),
    price: Number(item.price || item.sellingPrice || item.selling_price || 0),
    categoryId: String(item.categoryId || item.category_id || ''),
    categoryName: String(item.categoryName || item.category_name || ''),
    groupCode: String(item.groupCode || item.group_code || ''),
    description: String(item.description || ''),
    tag: String(item.tag || item.supplierProductNo || item.supplier_product_no || ''),
  };
}

/**
 * スマレジAPIレスポンスをCategory型にマッピング
 */
function transformSmaregiCategory(item: Record<string, unknown>): Category {
  return {
    categoryId: String(item.categoryId || item.category_id || ''),
    categoryCode: String(item.categoryCode || item.category_code || ''),
    categoryName: String(item.categoryName || item.category_name || ''),
    level: Number(item.level || 1),
    parentCategoryId: item.parentCategoryId || item.parent_category_id 
      ? String(item.parentCategoryId || item.parent_category_id) 
      : undefined,
  };
}

/**
 * APIリクエストを実行（Client Credentials Grantなので認証ヘッダー不要）
 */
async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * 商品一覧を取得
 */
export async function fetchProducts(params: ProductSearchParams = {}): Promise<Product[]> {
  // モックモードの場合
  if (useMockData) {
    console.log('=== Using mock products ===', params);
    let products = [...MOCK_PRODUCTS];
    
    // キーワード検索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      products = products.filter(p => 
        p.productName.toLowerCase().includes(keyword) ||
        p.productCode.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
      );
    }
    
    // カテゴリフィルター
    if (params.categoryId) {
      products = products.filter(p => p.categoryId === params.categoryId);
    }
    
    return products;
  }

  // 本番APIコール（Client Credentials Grant - 認証ヘッダー不要）
  try {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.categoryId) queryParams.append('category_id', params.categoryId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', (params.limit || 100).toString());

    const result = await fetchApi<ApiResponse<Record<string, unknown>[]>>(
      `${API_BASE_URL}/api/smaregi/products?${queryParams.toString()}`
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch products');
    }

    // スマレジAPIレスポンスをProduct型にマッピング
    return result.data.map(transformSmaregiProduct);
  } catch (error) {
    console.error('=== Error fetching products ===', error);
    throw error;
  }
}

/**
 * 商品一覧を全件取得（ページネーション対応）
 */
export async function fetchAllProducts(params: Omit<ProductSearchParams, 'page' | 'limit'> = {}): Promise<Product[]> {
  // モックモードの場合
  if (useMockData) {
    return fetchProducts(params);
  }

  // 本番APIコール（ページネーション）
  const allProducts: Product[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const products = await fetchProducts({ ...params, page, limit });
    allProducts.push(...products);
    
    // 取得件数がlimit未満なら終了
    if (products.length < limit) {
      hasMore = false;
    } else {
      page++;
    }

    // 安全のため最大10ページまで
    if (page > 10) {
      console.warn('Reached maximum page limit (10)');
      break;
    }
  }

  return allProducts;
}

/**
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<Category[]> {
  // モックモードの場合
  if (useMockData) {
    console.log('=== Using mock categories ===');
    return MOCK_CATEGORIES;
  }

  // 本番APIコール（Client Credentials Grant - 認証ヘッダー不要）
  try {
    const result = await fetchApi<ApiResponse<Record<string, unknown>[]>>(
      `${API_BASE_URL}/api/smaregi/categories`
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch categories');
    }

    // スマレジAPIレスポンスをCategory型にマッピング
    return result.data.map(transformSmaregiCategory);
  } catch (error) {
    console.error('=== Error fetching categories ===', error);
    throw error;
  }
}

/**
 * 商品詳細を取得
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  // モックモードの場合
  if (useMockData) {
    return MOCK_PRODUCTS.find(p => p.productId === productId) || null;
  }

  // 本番APIコール（Client Credentials Grant - 認証ヘッダー不要）
  try {
    const result = await fetchApi<ApiResponse<Record<string, unknown>>>(
      `${API_BASE_URL}/api/smaregi/products/${productId}`
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch product');
    }

    return transformSmaregiProduct(result.data);
  } catch (error) {
    console.error('=== Error fetching product ===', error);
    return null;
  }
}
