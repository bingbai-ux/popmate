/**
 * 同期サービス
 * IndexedDB（ローカル）とSupabase（クラウド）間のデータ同期を管理
 */

import { db } from './db';
import { SavedProject } from '@/types/project';
import { getUserId, getUserIdSync, ensureUserId } from './userIdentity';

// 同期状態
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// 同期イベント
export type SyncEvent =
  | { type: 'sync_started' }
  | { type: 'sync_completed'; synced: number; failed: number }
  | { type: 'sync_error'; error: string }
  | { type: 'conflict_detected'; projectId: string }
  | { type: 'offline' }
  | { type: 'online' };

// 同期キュー項目
interface SyncQueueItem {
  id: string;
  projectId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  retryCount: number;
  data?: Partial<SavedProject>;
}

// 同期設定
interface SyncConfig {
  apiBaseUrl: string;
  autoSync: boolean;
  syncInterval: number;  // ミリ秒
  maxRetries: number;
  conflictResolution: 'local' | 'remote' | 'newest';
}

const DEFAULT_CONFIG: SyncConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app',
  autoSync: true,
  syncInterval: 30000,  // 30秒
  maxRetries: 3,
  conflictResolution: 'newest',
};

type SyncEventListener = (event: SyncEvent) => void;

class SyncService {
  private config: SyncConfig;
  private syncQueue: SyncQueueItem[] = [];
  private status: SyncStatus = 'idle';
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: SyncEventListener[] = [];
  private isOnline: boolean = true;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeOnlineStatus();
    this.loadSyncQueue();
  }

  /**
   * オンライン状態の監視を初期化
   */
  private initializeOnlineStatus(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emit({ type: 'online' });
        this.processSyncQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emit({ type: 'offline' });
      });
    }
  }

  /**
   * 同期キューをローカルストレージから読み込み
   */
  private loadSyncQueue(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('popmate_sync_queue');
      if (stored) {
        try {
          this.syncQueue = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load sync queue:', e);
          this.syncQueue = [];
        }
      }
    }
  }

  /**
   * 同期キューをローカルストレージに保存
   */
  private saveSyncQueue(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('popmate_sync_queue', JSON.stringify(this.syncQueue));
    }
  }

  /**
   * イベントリスナーを追加
   */
  addEventListener(listener: SyncEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * イベントを発火
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * 同期状態を取得
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * 同期キューに追加
   */
  async queueSync(
    projectId: string,
    action: 'create' | 'update' | 'delete',
    data?: Partial<SavedProject>
  ): Promise<void> {
    // 同じプロジェクトの既存キューを更新
    const existingIndex = this.syncQueue.findIndex(
      item => item.projectId === projectId
    );

    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      action,
      timestamp: Date.now(),
      retryCount: 0,
      data,
    };

    if (existingIndex !== -1) {
      // 既存のアイテムがある場合はマージ
      const existing = this.syncQueue[existingIndex];
      if (action === 'delete') {
        // 削除は常に優先
        this.syncQueue[existingIndex] = queueItem;
      } else if (existing.action === 'create' && action === 'update') {
        // create後のupdateはcreateのままデータを更新
        this.syncQueue[existingIndex] = {
          ...existing,
          data: { ...existing.data, ...data },
          timestamp: Date.now(),
        };
      } else {
        this.syncQueue[existingIndex] = queueItem;
      }
    } else {
      this.syncQueue.push(queueItem);
    }

    this.saveSyncQueue();

    // オンラインなら即座に同期
    if (this.isOnline && this.config.autoSync) {
      this.processSyncQueue();
    }
  }

  /**
   * 同期キューを処理
   */
  async processSyncQueue(): Promise<void> {
    if (this.status === 'syncing' || !this.isOnline || this.syncQueue.length === 0) {
      console.log('[syncService] processSyncQueue skip:', { status: this.status, online: this.isOnline, queueLen: this.syncQueue.length });
      return;
    }

    console.log('[syncService] processSyncQueue: starting, queue length:', this.syncQueue.length);

    // ユーザーIDを事前に取得（incognito等でlocalStorageにない場合もAPIから取得）
    const userId = await ensureUserId();
    console.log('[syncService] processSyncQueue: userId:', userId || 'NONE');

    if (!userId) {
      console.error('[syncService] processSyncQueue: no user ID available, aborting sync');
      return;
    }

    this.status = 'syncing';
    this.emit({ type: 'sync_started' });

    let synced = 0;
    let failed = 0;

    for (const item of [...this.syncQueue]) {
      try {
        await this.processQueueItem(item);
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        synced++;
      } catch (error) {
        console.error(`[syncService] Sync failed for ${item.projectId} (attempt ${item.retryCount + 1}):`, error);
        item.retryCount++;

        if (item.retryCount >= this.config.maxRetries) {
          console.error(`[syncService] Max retries reached for ${item.projectId}, dropping from queue`);
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          failed++;
        }
      }
    }

    this.saveSyncQueue();
    this.status = 'idle';
    console.log('[syncService] processSyncQueue: done, synced:', synced, 'failed:', failed);
    this.emit({ type: 'sync_completed', synced, failed });
  }

  /**
   * リクエストヘッダーを構築（x-user-id を含む）
   */
  private getHeaders(contentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = 'application/json';
    const userId = getUserIdSync();
    if (userId) headers['x-user-id'] = userId;
    return headers;
  }

  /**
   * 個別のキューアイテムを処理
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { apiBaseUrl } = this.config;
    const headers = this.getHeaders(true);

    // ユーザーIDが取得できていない場合はエラー
    if (!headers['x-user-id']) {
      throw new Error('User ID not available for sync');
    }

    console.log(`[syncService] processing ${item.action} for ${item.projectId}, url: ${apiBaseUrl}`);

    switch (item.action) {
      case 'create': {
        const body = this.convertToApiFormat(item.data as SavedProject);
        console.log('[syncService] POST /api/saved-pops body:', JSON.stringify(body).slice(0, 200));
        const res = await fetch(`${apiBaseUrl}/api/saved-pops`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          credentials: 'include',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`POST /api/saved-pops failed (${res.status}): ${text}`);
        }
        const result = await res.json().catch(() => null);
        console.log('[syncService] POST success:', result?.data?.id);
        break;
      }

      case 'update': {
        const res = await fetch(`${apiBaseUrl}/api/saved-pops/${item.projectId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.convertToApiFormat(item.data as Partial<SavedProject>)),
          credentials: 'include',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`PUT /api/saved-pops/${item.projectId} failed (${res.status}): ${text}`);
        }
        console.log('[syncService] PUT success:', item.projectId);
        break;
      }

      case 'delete': {
        const res = await fetch(`${apiBaseUrl}/api/saved-pops/${item.projectId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          credentials: 'include',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`DELETE /api/saved-pops/${item.projectId} failed (${res.status}): ${text}`);
        }
        console.log('[syncService] DELETE success:', item.projectId);
        break;
      }
    }
  }

  /**
   * ローカル形式をAPI形式に変換
   * design_data にデザイン要素・メタ情報を全て格納
   */
  private convertToApiFormat(project: Partial<SavedProject>): Record<string, unknown> {
    const result: Record<string, unknown> = {
      name: project.name,
      width_mm: project.template?.width,
      height_mm: project.template?.height,
      design_data: {
        background: { color: '#ffffff' },
        elements: project.elements || [],
        // メタ情報（他デバイスで復元するために必要）
        saveType: project.saveType || 'project',
        template: project.template,
        taxSettings: project.taxSettings,
        thumbnail: project.thumbnail,
      },
      selected_products: project.selectedProducts?.map(p => ({
        product_id: p.productId,
        product_code: p.productCode,
        product_name: p.productName,
        price: p.price,
        tax_rate: p.taxRate,
        category_name: p.categoryName,
      })) || [],
      print_settings: {
        paper_size: 'A4',
        orientation: 'portrait',
        border_enabled: true,
        border_color: '#000000',
        border_width: 1,
        margin_mm: 5,
      },
    };

    // UUID形式のIDを含める（レガシーのproj-形式は除外）
    if (project.id && !project.id.startsWith('proj-')) {
      result.id = project.id;
    }

    return result;
  }

  /**
   * リモートからローカルへ同期
   */
  async pullFromRemote(): Promise<number> {
    if (!this.isOnline) {
      throw new Error('Offline');
    }

    // ユーザーIDを事前に取得
    await ensureUserId();

    const { apiBaseUrl } = this.config;

    try {
      const headers = this.getHeaders();
      console.log('[syncService] pullFromRemote: fetching from', `${apiBaseUrl}/api/saved-pops`, 'userId:', headers['x-user-id'] || 'MISSING');

      if (!headers['x-user-id']) {
        throw new Error('User ID not available for pull');
      }

      const response = await fetch(`${apiBaseUrl}/api/saved-pops`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`GET /api/saved-pops failed (${response.status}): ${text}`);
      }

      const { data: remotePops } = await response.json();
      console.log('[syncService] pullFromRemote: got', remotePops?.length || 0, 'remote records');
      let imported = 0;

      for (const remotePop of remotePops || []) {
        const localProject = await db.projects.get(remotePop.id);

        if (!localProject) {
          // ローカルに存在しない場合は作成
          const converted = this.convertFromApiFormat(remotePop);
          console.log('[syncService] pullFromRemote: importing', converted.id, converted.name);
          await db.projects.add(converted);
          imported++;
        } else {
          // コンフリクト解決
          const resolved = this.resolveConflict(localProject, remotePop);
          if (resolved !== localProject) {
            await db.projects.put(resolved);
            imported++;
          }
        }
      }

      console.log('[syncService] pullFromRemote: imported', imported, 'records');
      return imported;
    } catch (error) {
      console.error('[syncService] pullFromRemote failed:', error);
      throw error;
    }
  }

  /**
   * API形式からローカル形式に変換
   * design_data 内のメタ情報も復元する
   */
  private convertFromApiFormat(apiData: Record<string, unknown>): SavedProject {
    const designData = apiData.design_data as {
      elements?: unknown[];
      saveType?: string;
      template?: { id: string; name: string; width: number; height: number };
      taxSettings?: { enabled: boolean; taxRate: number; roundingMode: string };
      thumbnail?: string;
    } | undefined;
    const selectedProducts = apiData.selected_products as Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      price: number;
      tax_rate?: number;
      category_name?: string;
    }> | undefined;

    // テンプレート情報: design_data内のメタ情報を優先、なければAPIフィールドから復元
    const template = designData?.template || {
      id: 'custom',
      name: 'カスタム',
      width: apiData.width_mm as number,
      height: apiData.height_mm as number,
    };

    return {
      id: apiData.id as string,
      name: apiData.name as string,
      saveType: (designData?.saveType as 'template' | 'project') || 'project',
      createdAt: new Date(apiData.created_at as string),
      updatedAt: new Date(apiData.updated_at as string),
      thumbnail: designData?.thumbnail,
      template,
      elements: (designData?.elements || []) as SavedProject['elements'],
      selectedProducts: selectedProducts?.map(p => ({
        productId: p.product_id,
        productCode: p.product_code,
        productName: p.product_name,
        price: p.price,
        taxRate: p.tax_rate,
        categoryName: p.category_name,
      })) as SavedProject['selectedProducts'] || [],
      taxSettings: (designData?.taxSettings as SavedProject['taxSettings']) || {
        enabled: true,
        taxRate: 10,
        roundingMode: 'floor' as const,
      },
      editedProductData: {},
    };
  }

  /**
   * コンフリクト解決
   */
  private resolveConflict(
    local: SavedProject,
    remote: Record<string, unknown>
  ): SavedProject {
    const remoteUpdatedAt = new Date(remote.updated_at as string).getTime();
    const localUpdatedAt = local.updatedAt.getTime();

    switch (this.config.conflictResolution) {
      case 'local':
        return local;
      case 'remote':
        return this.convertFromApiFormat(remote);
      case 'newest':
      default:
        return remoteUpdatedAt > localUpdatedAt
          ? this.convertFromApiFormat(remote)
          : local;
    }
  }

  /**
   * 自動同期を開始
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      this.processSyncQueue();
    }, this.config.syncInterval);
  }

  /**
   * 自動同期を停止
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * 手動で完全同期を実行
   */
  async fullSync(): Promise<{ pushed: number; pulled: number }> {
    // まずローカルの変更をプッシュ
    await this.processSyncQueue();
    const pushedCount = this.syncQueue.length;

    // リモートからプル
    const pulledCount = await this.pullFromRemote();

    return {
      pushed: pushedCount,
      pulled: pulledCount,
    };
  }

  /**
   * 保留中の同期数を取得
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }
}

// シングルトンインスタンス
export const syncService = new SyncService();

// React Hook用のエクスポート
export function useSyncService() {
  return syncService;
}
