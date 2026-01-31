// 認証ユーティリティ

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

/**
 * 認証コールバックを処理
 * URLパラメータからトークンを取得してローカルストレージに保存
 */
export async function handleAuthCallback(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/smaregi/callback?code=${encodeURIComponent(code)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || '認証に失敗しました',
      };
    }

    const data = await response.json();

    if (data.token && data.contractId) {
      localStorage.setItem('smaregi_token', data.token);
      localStorage.setItem('smaregi_contract_id', data.contractId);
      return { success: true };
    }

    return {
      success: false,
      error: '認証情報の取得に失敗しました',
    };
  } catch (error) {
    console.error('Auth callback error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * 認証トークンをリフレッシュ
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('smaregi_token');
    const contractId = localStorage.getItem('smaregi_contract_id');

    if (!token || !contractId) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/smaregi/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-smaregi-token': token,
        'x-smaregi-contract-id': contractId,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('smaregi_token', data.token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

/**
 * 認証ヘッダーを取得
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('smaregi_token');
    const contractId = localStorage.getItem('smaregi_contract_id');
    if (token) headers['x-smaregi-token'] = token;
    if (contractId) headers['x-smaregi-contract-id'] = contractId;
  }

  return headers;
}

/**
 * 認証済みかどうかを確認
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('smaregi_token');
  const contractId = localStorage.getItem('smaregi_contract_id');
  return !!(token && contractId);
}
