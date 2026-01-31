// IndexedDB設定（Dexie.js）

import Dexie, { Table } from 'dexie';
import { SavedProject } from '@/types/project';

/**
 * PopMate データベースクラス
 */
class PopMateDB extends Dexie {
  projects!: Table<SavedProject, string>;

  constructor() {
    super('PopMateDB');
    
    // データベーススキーマ定義
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt'
    });
  }
}

// データベースインスタンス（シングルトン）
export const db = new PopMateDB();

/**
 * データベースを初期化（必要に応じてクリア）
 */
export async function initDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('PopMateDB initialized');
  } catch (error) {
    console.error('Failed to initialize PopMateDB:', error);
    throw error;
  }
}

/**
 * データベースをクリア（開発用）
 */
export async function clearDatabase(): Promise<void> {
  try {
    await db.projects.clear();
    console.log('PopMateDB cleared');
  } catch (error) {
    console.error('Failed to clear PopMateDB:', error);
    throw error;
  }
}
