// カスタムテンプレートの型定義

import { getUserId, getUserIdSync } from '@/lib/userIdentity';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  width: number;   // mm
  height: number;  // mm
  isSystem: boolean;
  createdAt: string;
}

// デフォルトテンプレート
export const DEFAULT_TEMPLATES: CustomTemplate[] = [
  {
    id: 'price-pop',
    name: 'プライスポップ',
    description: '価格表示に最適な定番サイズ',
    width: 91,
    height: 55,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a4',
    name: 'A4サイズ',
    description: '大きな掲示物やポスターに',
    width: 210,
    height: 297,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a5',
    name: 'A5サイズ',
    description: '棚札やミニポスターに最適',
    width: 148,
    height: 210,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'a6',
    name: 'A6サイズ',
    description: 'コンパクトな商品タグに',
    width: 105,
    height: 148,
    isSystem: true,
    createdAt: '',
  },
];

// ローカルストレージからカスタムテンプレートを取得
export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('customTemplates');
  return saved ? JSON.parse(saved) : [];
}

// カスタムテンプレートを保存（ローカル + バックエンド同期）
export function saveCustomTemplate(template: Omit<CustomTemplate, 'id' | 'isSystem' | 'createdAt'>): CustomTemplate {
  const templates = getCustomTemplates();
  const newTemplate: CustomTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };
  templates.push(newTemplate);
  localStorage.setItem('customTemplates', JSON.stringify(templates));

  // バックエンドに非同期で同期（エラーがあっても保存を妨げない）
  syncTemplateToBackend(newTemplate).catch(e =>
    console.warn('[template] バックエンド同期失敗（保存）:', e)
  );

  return newTemplate;
}

// カスタムテンプレートを削除（ローカル + バックエンド同期）
export function deleteCustomTemplate(id: string): boolean {
  const templates = getCustomTemplates();
  const template = templates.find(t => t.id === id);
  if (!template || template.isSystem) return false;

  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem('customTemplates', JSON.stringify(filtered));

  // バックエンドから非同期で削除
  deleteTemplateFromBackend(id).catch(e =>
    console.warn('[template] バックエンド同期失敗（削除）:', e)
  );

  return true;
}

// 全テンプレートを取得（デフォルト + カスタム）
export function getAllTemplates(): CustomTemplate[] {
  return [...DEFAULT_TEMPLATES, ...getCustomTemplates()];
}

// IDでテンプレートを取得
export function getTemplateById(id: string): CustomTemplate | undefined {
  return getAllTemplates().find(t => t.id === id);
}

/**
 * テンプレート情報がlocalStorageに存在することを保証する
 * 別PCで保存プロジェクトを開く際、カスタムテンプレートが未登録の場合に登録する
 */
export function ensureTemplateRegistered(template: { id: string; name: string; width: number; height: number }): void {
  if (typeof window === 'undefined') return;
  // システムテンプレートは既に定義済み
  if (DEFAULT_TEMPLATES.some(t => t.id === template.id)) return;
  // 既にlocalStorageに存在する場合はスキップ
  const existing = getCustomTemplates();
  if (existing.some(t => t.id === template.id)) return;
  // 未登録のカスタムテンプレートを追加
  existing.push({
    id: template.id,
    name: template.name,
    description: '',
    width: template.width,
    height: template.height,
    isSystem: false,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('customTemplates', JSON.stringify(existing));
}

// ─── バックエンド同期関数 ───

/**
 * カスタムテンプレートをバックエンドに保存
 */
async function syncTemplateToBackend(template: CustomTemplate): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  await fetch(`${API_BASE}/api/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      name: template.name,
      type: 'custom',
      width_mm: template.width,
      height_mm: template.height,
      design_data: {
        background: { color: '#ffffff' },
        elements: [],
        description: template.description,
        localId: template.id,
      },
    }),
  });
}

/**
 * カスタムテンプレートをバックエンドから削除
 */
async function deleteTemplateFromBackend(localId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  // ローカルIDでバックエンドのテンプレートを検索して削除
  try {
    const res = await fetch(`${API_BASE}/api/templates/user`, {
      headers: { 'x-user-id': userId },
    });
    if (!res.ok) return;
    const { data } = await res.json();
    const remote = data?.find((t: any) => t.design_data?.localId === localId);
    if (remote) {
      await fetch(`${API_BASE}/api/templates/${remote.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });
    }
  } catch {
    // バックエンド削除失敗は無視
  }
}

/**
 * バックエンドからカスタムテンプレートを取得してローカルとマージ
 */
export async function fetchAndMergeRemoteTemplates(): Promise<CustomTemplate[]> {
  const userId = await getUserId();
  if (!userId) return getCustomTemplates();

  try {
    const res = await fetch(`${API_BASE}/api/templates/user`, {
      headers: { 'x-user-id': userId },
      cache: 'no-store',
    });
    if (!res.ok) return getCustomTemplates();

    const { data } = await res.json();
    if (!Array.isArray(data) || data.length === 0) return getCustomTemplates();

    const localTemplates = getCustomTemplates();
    const localIds = new Set(localTemplates.map(t => t.id));

    // リモートにあってローカルにないテンプレートを追加
    const remoteTemplates: CustomTemplate[] = data
      .filter((t: any) => !t.is_system)
      .map((t: any) => ({
        id: t.design_data?.localId || `remote-${t.id}`,
        name: t.name,
        description: t.design_data?.description || '',
        width: t.width_mm,
        height: t.height_mm,
        isSystem: false,
        createdAt: t.created_at,
      }));

    // マージ: ローカルに存在しないリモートテンプレートを追加
    let merged = [...localTemplates];
    for (const remote of remoteTemplates) {
      if (!localIds.has(remote.id)) {
        merged.push(remote);
      }
    }

    // ローカルストレージを更新
    localStorage.setItem('customTemplates', JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('[template] リモートテンプレート取得失敗:', e);
    return getCustomTemplates();
  }
}
