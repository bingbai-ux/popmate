// frontend/src/lib/editorStorage.ts
// エディター状態の保存・復元（sessionStorage使用）

import type { RoundingMethod } from './api';
import type { EditorElement as EditorElementType } from '@/types/editor';

// エディター状態の型定義
export interface EditorState {
  elements: EditorElementType[];
  templateId: string;
  templateName?: string;
  templateWidth?: number;
  templateHeight?: number;
  zoom: number;
  updatedAt: number;
  roundingMethod: RoundingMethod;
}

// 後方互換性のためにEditorElementをエクスポート
export type EditorElement = EditorElementType;

const STORAGE_KEY = 'popmate_editor_state';

/**
 * エディター状態を保存
 */
export function saveEditorState(state: Omit<EditorState, 'updatedAt'>): void {
  try {
    const stateWithTimestamp: EditorState = {
      ...state,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    console.log('[editorStorage] 状態を保存しました:', state.elements.length, '要素');
  } catch (error) {
    console.error('[editorStorage] 保存エラー:', error);
  }
}

/**
 * エディター状態を復元
 */
export function loadEditorState(templateId: string): EditorState | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state: EditorState = JSON.parse(saved);

    // テンプレートIDが一致しない場合は無効
    if (state.templateId !== templateId) {
      console.log('[editorStorage] テンプレートIDが一致しないため無視:', state.templateId, '!==', templateId);
      return null;
    }

    // 24時間以上経過している場合は無効
    const maxAge = 24 * 60 * 60 * 1000; // 24時間
    if (Date.now() - state.updatedAt > maxAge) {
      console.log('[editorStorage] 有効期限切れのため無視');
      clearEditorState();
      return null;
    }

    console.log('[editorStorage] 状態を復元しました:', state.elements.length, '要素');
    return state;
  } catch (error) {
    console.error('[editorStorage] 復元エラー:', error);
    return null;
  }
}

/**
 * エディター状態をクリア
 */
export function clearEditorState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[editorStorage] 状態をクリアしました');
  } catch (error) {
    console.error('[editorStorage] クリアエラー:', error);
  }
}

/**
 * 保存されているテンプレートIDを取得
 */
export function getSavedTemplateId(): string | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const state: EditorState = JSON.parse(saved);
    return state.templateId;
  } catch {
    return null;
  }
}
