/**
 * 同期サービス
 * IndexedDB（ローカル）とSupabase（クラウド）間のデータ同期を管理
 */

import { db } from './db';
import { SavedProject } from '@/types/project';

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
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
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
        console.error(`Sync failed for ${item.projectId}:`, error);
        item.retryCount++;

        if (item.retryCount >= this.config.maxRetries) {
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          failed++;
        }
      }
    }

    this.saveSyncQueue();
    this.status = 'idle';
    this.emit({ type: 'sync_completed', synced, failed });
  }

  /**
   * 個別のキューアイテムを処理
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { apiBaseUrl } = this.config;

    switch (item.action) {
      case 'create':
        await fetch(`${apiBaseUrl}/api/saved-pops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.convertToApiFormat(item.data as SavedProject)),
          credentials: 'include',
        });
        break;

      case 'update':
        await fetch(`${apiBaseUrl}/api/saved-pops/${item.projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.convertToApiFormat(item.data as Partial<SavedProject>)),
          credentials: 'include',
        });
        break;

      case 'delete':
        await fetch(`${apiBaseUrl}/api/saved-pops/${item.projectId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        break;
    }
  }

  /**
   * ローカル形式をAPI形式に変換
   */
  private convertToApiFormat(project: Partial<SavedProject>): Record<string, unknown> {
    return {
      name: project.name,
      width_mm: project.template?.width,
      height_mm: project.template?.height,
      design_data: {
        background: { color: '#ffffff' },
        elements: project.elements || [],
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
  }

  /**
   * リモートからローカルへ同期
   */
  async pullFromRemote(): Promise<number> {
    if (!this.isOnline) {
      throw new Error('Offline');
    }

    const { apiBaseUrl } = this.config;

    try {
      const response = await fetch(`${apiBaseUrl}/api/saved-pops`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch remote data');
      }

      const { data: remotePops } = await response.json();
      let imported = 0;

      for (const remotePop of remotePops || []) {
        const localProject = await db.projects.get(remotePop.id);

        if (!localProject) {
          // ローカルに存在しない場合は作成
          await db.projects.add(this.convertFromApiFormat(remotePop));
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

      return imported;
    } catch (error) {
      console.error('Pull from remote failed:', error);
      throw error;
    }
  }

  /**
   * API形式からローカル形式に変換
   */
  private convertFromApiFormat(apiData: Record<string, unknown>): SavedProject {
    const designData = apiData.design_data as { elements?: unknown[] } | undefined;
    const selectedProducts = apiData.selected_products as Array<{
      product_id: string;
      product_code: string;
      product_name: string;
      price: number;
      tax_rate?: number;
      category_name?: string;
    }> | undefined;

    return {
      id: apiData.id as string,
      name: apiData.name as string,
      saveType: 'project',
      createdAt: new Date(apiData.created_at as string),
      updatedAt: new Date(apiData.updated_at as string),
      template: {
        id: 'custom',
        name: 'カスタム',
        width: apiData.width_mm as number,
        height: apiData.height_mm as number,
      },
      elements: (designData?.elements || []) as SavedProject['elements'],
      selectedProducts: selectedProducts?.map(p => ({
        productId: p.product_id,
        productCode: p.product_code,
        productName: p.product_name,
        price: p.price,
        taxRate: p.tax_rate,
        categoryName: p.category_name,
      })) as SavedProject['selectedProducts'] || [],
      taxSettings: {
        enabled: true,
        taxRate: 10,
        roundingMode: 'floor',
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
