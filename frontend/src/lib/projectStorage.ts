// プロジェクト保存・読み込みユーティリティ

import { db } from './db';
import { SavedProject, CreateProjectInput, UpdateProjectInput, GetProjectsOptions, SaveType } from '@/types/project';
import { DEFAULT_TAX_SETTINGS } from '@/types/editor';
import { Product } from '@/types/product';
import { EditorElement } from '@/types/editor';

/**
 * ユニークIDを生成
 */
export function generateProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * プロジェクトを保存（新規作成または上書き）
 * 印刷画面から呼び出される簡易版
 */
export async function saveProject(data: {
  id: string;
  name: string;
  saveType: SaveType;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  template: { id: string; name: string; width: number; height: number };
  elements: EditorElement[];
  selectedProducts: Product[];
  roundingMethod: 'round' | 'floor' | 'ceil';
}): Promise<void> {
  const project: SavedProject = {
    id: data.id,
    name: data.name,
    saveType: data.saveType,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    thumbnail: data.thumbnail,
    template: data.template,
    elements: data.elements,
    selectedProducts: data.saveType === 'template' ? [] : data.selectedProducts,
    taxSettings: {
      ...DEFAULT_TAX_SETTINGS,
      roundingMode: data.roundingMethod,
    },
    editedProductData: {},
  };

  console.log('[projectStorage] ★ saving project:', { id: project.id, name: project.name, saveType: project.saveType });
  await db.projects.put(project);
}

/**
 * プロジェクトを作成
 */
export async function createProject(input: CreateProjectInput): Promise<SavedProject> {
  const now = new Date();
  
  const project: SavedProject = {
    id: generateProjectId(),
    name: input.name,
    saveType: input.saveType,
    createdAt: now,
    updatedAt: now,
    template: input.template,
    elements: input.elements,
    selectedProducts: input.saveType === 'template' ? [] : (input.selectedProducts || []),
    taxSettings: input.taxSettings || DEFAULT_TAX_SETTINGS,
    editedProductData: input.editedProductData || {},
  };

  await db.projects.add(project);
  return project;
}

/**
 * プロジェクトを更新
 */
export async function updateProject(id: string, input: UpdateProjectInput): Promise<SavedProject | null> {
  const project = await db.projects.get(id);
  
  if (!project) {
    return null;
  }

  const updatedProject: SavedProject = {
    ...project,
    ...input,
    updatedAt: new Date(),
  };

  await db.projects.put(updatedProject);
  return updatedProject;
}

/**
 * プロジェクトを取得
 */
export async function getProject(id: string): Promise<SavedProject | null> {
  const project = await db.projects.get(id);
  return project || null;
}

/**
 * プロジェクト一覧を取得
 */
export async function getProjects(options: GetProjectsOptions = {}): Promise<SavedProject[]> {
  const { sortBy = 'updatedAt', sortOrder = 'desc', limit } = options;

  let collection = db.projects.orderBy(sortBy);
  
  if (sortOrder === 'desc') {
    collection = collection.reverse();
  }

  if (limit) {
    return await collection.limit(limit).toArray();
  }

  return await collection.toArray();
}

/**
 * テンプレート保存のみ取得
 */
export async function getSavedTemplates(): Promise<SavedProject[]> {
  const all = await getProjects({ sortBy: 'updatedAt', sortOrder: 'desc' });
  return all.filter(p => p.saveType === 'template');
}

/**
 * プロジェクト保存のみ取得
 */
export async function getSavedProjects(): Promise<SavedProject[]> {
  const all = await getProjects({ sortBy: 'updatedAt', sortOrder: 'desc' });
  return all.filter(p => p.saveType !== 'template');
}

/**
 * プロジェクトを削除
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    await db.projects.delete(id);
    return true;
  } catch (error) {
    console.error('Failed to delete project:', error);
    return false;
  }
}

/**
 * プロジェクトを複製
 */
export async function duplicateProject(id: string, newName?: string): Promise<SavedProject | null> {
  const project = await db.projects.get(id);
  
  if (!project) {
    return null;
  }

  const now = new Date();
  const duplicated: SavedProject = {
    ...project,
    id: generateProjectId(),
    name: newName || `${project.name} (コピー)`,
    createdAt: now,
    updatedAt: now,
  };

  await db.projects.add(duplicated);
  return duplicated;
}

/**
 * プロジェクト数を取得
 */
export async function getProjectCount(): Promise<number> {
  return await db.projects.count();
}

/**
 * キャンバスからサムネイルを生成
 */
export async function generateThumbnail(canvasElement: HTMLElement): Promise<string> {
  try {
    // html2canvasを動的インポート
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(canvasElement, {
      scale: 0.5,  // サムネイル用に縮小
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    // 最大幅200pxにリサイズ
    const maxWidth = 200;
    const ratio = maxWidth / canvas.width;
    
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = maxWidth;
    resizedCanvas.height = canvas.height * ratio;
    
    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
    }

    return resizedCanvas.toDataURL('image/jpeg', 0.7);
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return '';
  }
}

/**
 * プロジェクトをエクスポート（JSON）
 */
export async function exportProject(id: string): Promise<string | null> {
  const project = await db.projects.get(id);
  
  if (!project) {
    return null;
  }

  return JSON.stringify(project, null, 2);
}

/**
 * プロジェクトをインポート（JSON）
 */
export async function importProject(jsonString: string): Promise<SavedProject | null> {
  try {
    const data = JSON.parse(jsonString);
    
    // 必須フィールドの検証
    if (!data.name || !data.template || !data.elements) {
      throw new Error('Invalid project data');
    }

    const now = new Date();
    const project: SavedProject = {
      id: generateProjectId(),
      name: data.name,
      saveType: data.saveType || 'project',
      createdAt: now,
      updatedAt: now,
      thumbnail: data.thumbnail,
      template: data.template,
      elements: data.elements,
      selectedProducts: data.selectedProducts || [],
      taxSettings: data.taxSettings || DEFAULT_TAX_SETTINGS,
      editedProductData: data.editedProductData || {},
    };

    await db.projects.add(project);
    return project;
  } catch (error) {
    console.error('Failed to import project:', error);
    return null;
  }
}
