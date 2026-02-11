/**
 * ユーザー識別管理
 * バックエンドからユーザーID（契約ID）を取得し、キャッシュする
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';
const STORAGE_KEY = 'popmate_user_id';

let cachedUserId: string | null = null;

/**
 * ユーザーIDを取得（キャッシュ優先）
 */
export async function getUserId(): Promise<string | null> {
  // メモリキャッシュ
  if (cachedUserId) return cachedUserId;

  // localStorageキャッシュ
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedUserId = stored;
      return stored;
    }
  }

  // バックエンドから取得
  try {
    const res = await fetch(`${API_BASE}/api/auth/identity`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.userId) {
      cachedUserId = json.userId;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, json.userId);
      }
      return json.userId;
    }
  } catch (e) {
    console.error('[userIdentity] Failed to fetch user ID:', e);
  }
  return null;
}

/**
 * ユーザーIDをキャッシュから同期的に取得（なければnull）
 */
export function getUserIdSync(): string | null {
  if (cachedUserId) return cachedUserId;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedUserId = stored;
      return stored;
    }
  }
  return null;
}
