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
    
    // v1: 初期スキーマ
    this.version(1).stores({
      projects: 'id, name, updatedAt, createdAt'
    });

    // v2: saveTypeカラム追加
    this.version(2).stores({
      projects: 'id, name, updatedAt, createdAt, saveType'
    }).upgrade(tx => {
      // 既存データにsaveType='project'を設定
      return tx.table('projects').toCollection().modify(project => {
        if (!project.saveType) {
          project.saveType = 'project';
        }
      });
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
