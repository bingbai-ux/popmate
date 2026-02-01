// 保存プロジェクトの型定義

import { EditorElement, TaxSettings } from './editor';
import { Product } from './product';

/**
 * 保存タイプ
 * - template: デザインのみ（テンプレートとして再利用）
 * - project: デザイン＋商品データ（編集を再開）
 */
export type SaveType = 'template' | 'project';

/**
 * 保存されたプロジェクト
 */
export interface SavedProject {
  id: string;
  name: string;
  saveType: SaveType;              // ★ 追加: 保存タイプ
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;              // Base64 サムネイル画像
  template: {
    id: string;
    name: string;
    width: number;                 // mm
    height: number;                // mm
  };
  elements: EditorElement[];       // デザイン要素
  selectedProducts: Product[];     // 選択された商品（projectのみ）
  taxSettings: TaxSettings;        // 税設定
  editedProductData?: Record<string, Partial<Product>>;  // 編集された商品データ
}

/**
 * プロジェクト作成時の入力
 */
export interface CreateProjectInput {
  name: string;
  saveType: SaveType;
  template: {
    id: string;
    name: string;
    width: number;
    height: number;
  };
  elements: EditorElement[];
  selectedProducts?: Product[];
  taxSettings?: TaxSettings;
  editedProductData?: Record<string, Partial<Product>>;
}

/**
 * プロジェクト更新時の入力
 */
export interface UpdateProjectInput {
  name?: string;
  thumbnail?: string;
  elements?: EditorElement[];
  selectedProducts?: Product[];
  taxSettings?: TaxSettings;
  editedProductData?: Record<string, Partial<Product>>;
}

/**
 * プロジェクト一覧のソート順
 */
export type ProjectSortOrder = 'updatedAt' | 'createdAt' | 'name';

/**
 * プロジェクト一覧の取得オプション
 */
export interface GetProjectsOptions {
  sortBy?: ProjectSortOrder;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}
