// APIクライアント

import { Product, Category, ProductSearchParams, ApiResponse, MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

// 開発モードフラグ（スマレジ認証前はモックデータを使用）
const USE_MOCK = true;

type ApiHeaders = Record<string, string>;

function getHeaders(): ApiHeaders {
  const headers: ApiHeaders = {
    'Content-Type': 'application/json',
  };
  
  // スマレジ認証情報（ローカルストレージから取得）
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('smaregi_token');
    const contractId = localStorage.getItem('smaregi_contract_id');
    if (token) headers['x-smaregi-token'] = token;
    if (contractId) headers['x-smaregi-contract-id'] = contractId;
  }
  
  return headers;
}

/**
 * 商品一覧を取得
 */
export async function fetchProducts(params: ProductSearchParams = {}): Promise<Product[]> {
  // モックモードの場合
  if (USE_MOCK) {
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

  // 本番APIコール
  try {
    const queryParams = new URLSearchParams();
    if (params.keyword) queryParams.append('keyword', params.keyword);
    if (params.categoryId) queryParams.append('category_id', params.categoryId);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/smaregi/products?${queryParams.toString()}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result: ApiResponse<Product[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch products');
    }

    return result.data;
  } catch (error) {
    console.error('=== Error fetching products ===', error);
    throw error;
  }
}

/**
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<Category[]> {
  // モックモードの場合
  if (USE_MOCK) {
    console.log('=== Using mock categories ===');
    return MOCK_CATEGORIES;
  }

  // 本番APIコール
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/smaregi/categories`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result: ApiResponse<Category[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch categories');
    }

    return result.data;
  } catch (error) {
    console.error('=== Error fetching categories ===', error);
    throw error;
  }
}
