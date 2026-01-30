import type { 
  Template, 
  SavedPop, 
  SmaregiProduct, 
  SmaregiCategory,
  ApiResponse,
  PaginatedResponse 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

/**
 * APIリクエストのベース関数
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('=== API Request ===', { url, method: options.method || 'GET' });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('=== API Error ===', { status: response.status, error });
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('=== API Response ===', { endpoint, success: true });
    return data;
  } catch (error) {
    console.error('=== API Fetch Error ===', { endpoint, error });
    throw error;
  }
}

// ===== テンプレートAPI =====

/**
 * システムテンプレート一覧を取得
 */
export async function getSystemTemplates(): Promise<ApiResponse<Template[]>> {
  return fetchApi<ApiResponse<Template[]>>('/api/templates/system');
}

/**
 * ユーザーテンプレート一覧を取得
 */
export async function getUserTemplates(userId: string): Promise<ApiResponse<Template[]>> {
  return fetchApi<ApiResponse<Template[]>>('/api/templates/user', {
    headers: { 'x-user-id': userId },
  });
}

/**
 * テンプレートを取得
 */
export async function getTemplate(templateId: string): Promise<ApiResponse<Template>> {
  return fetchApi<ApiResponse<Template>>(`/api/templates/${templateId}`);
}

/**
 * テンプレートを作成
 */
export async function createTemplate(
  userId: string,
  template: Partial<Template>
): Promise<ApiResponse<Template>> {
  return fetchApi<ApiResponse<Template>>('/api/templates', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify(template),
  });
}

/**
 * テンプレートを更新
 */
export async function updateTemplate(
  templateId: string,
  userId: string,
  template: Partial<Template>
): Promise<ApiResponse<Template>> {
  return fetchApi<ApiResponse<Template>>(`/api/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'x-user-id': userId },
    body: JSON.stringify(template),
  });
}

/**
 * テンプレートを削除
 */
export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<ApiResponse<void>> {
  return fetchApi<ApiResponse<void>>(`/api/templates/${templateId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  });
}

// ===== 保存データAPI =====

/**
 * 保存データ一覧を取得
 */
export async function getSavedPops(userId: string): Promise<ApiResponse<SavedPop[]>> {
  return fetchApi<ApiResponse<SavedPop[]>>('/api/saved-pops', {
    headers: { 'x-user-id': userId },
  });
}

/**
 * 保存データを取得
 */
export async function getSavedPop(
  savedPopId: string,
  userId: string
): Promise<ApiResponse<SavedPop>> {
  return fetchApi<ApiResponse<SavedPop>>(`/api/saved-pops/${savedPopId}`, {
    headers: { 'x-user-id': userId },
  });
}

/**
 * ポップを保存
 */
export async function savePop(
  userId: string,
  pop: Partial<SavedPop>
): Promise<ApiResponse<SavedPop>> {
  return fetchApi<ApiResponse<SavedPop>>('/api/saved-pops', {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: JSON.stringify(pop),
  });
}

/**
 * 保存データを更新
 */
export async function updateSavedPop(
  savedPopId: string,
  userId: string,
  pop: Partial<SavedPop>
): Promise<ApiResponse<SavedPop>> {
  return fetchApi<ApiResponse<SavedPop>>(`/api/saved-pops/${savedPopId}`, {
    method: 'PUT',
    headers: { 'x-user-id': userId },
    body: JSON.stringify(pop),
  });
}

/**
 * 保存データを削除
 */
export async function deleteSavedPop(
  savedPopId: string,
  userId: string
): Promise<ApiResponse<void>> {
  return fetchApi<ApiResponse<void>>(`/api/saved-pops/${savedPopId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  });
}

// ===== スマレジAPI =====

/**
 * スマレジ認証URLを取得
 */
export async function getSmaregiAuthUrl(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
  return fetchApi<ApiResponse<{ authUrl: string; state: string }>>('/api/smaregi/auth');
}

/**
 * 商品一覧を取得
 */
export async function getSmaregiProducts(
  accessToken: string,
  contractId: string,
  params: {
    keyword?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedResponse<SmaregiProduct>> {
  const queryParams = new URLSearchParams();
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.categoryId) queryParams.append('category_id', params.categoryId);
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));

  return fetchApi<PaginatedResponse<SmaregiProduct>>(
    `/api/smaregi/products?${queryParams.toString()}`,
    {
      headers: {
        'x-smaregi-token': accessToken,
        'x-smaregi-contract-id': contractId,
      },
    }
  );
}

/**
 * カテゴリ一覧を取得
 */
export async function getSmaregiCategories(
  accessToken: string,
  contractId: string
): Promise<ApiResponse<SmaregiCategory[]>> {
  return fetchApi<ApiResponse<SmaregiCategory[]>>('/api/smaregi/categories', {
    headers: {
      'x-smaregi-token': accessToken,
      'x-smaregi-contract-id': contractId,
    },
  });
}
