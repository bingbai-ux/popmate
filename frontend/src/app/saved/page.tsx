'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import ProjectGrid from '@/components/saved/ProjectGrid';
import { SavedProject } from '@/types/project';
import { getSavedProjects, deleteProject, duplicateProject } from '@/lib/projectStorage';
import { saveSelectedProducts } from '@/lib/selectedProductsStorage';
import { syncService } from '@/lib/syncService';
import { getUserId } from '@/lib/userIdentity';

export default function SavedPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedProject | null>(null);

  // プロジェクト一覧を取得（プロジェクトのみ）
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSavedProjects();
      console.log('[saved] ★ loaded projects:', data.map(p => ({ id: p.id, name: p.name, saveType: p.saveType })));
      setProjects(data);

      // バックエンドからリモートデータを同期
      try {
        const userId = await getUserId();
        console.log('[saved] ★ userId for pull:', userId || 'NONE');
        const imported = await syncService.pullFromRemote();
        console.log('[saved] ★ pull imported:', imported, 'records');
        if (imported > 0) {
          const refreshed = await getSavedProjects();
          console.log('[saved] ★ refreshed projects:', refreshed.map(p => ({ id: p.id, name: p.name })));
          setProjects(refreshed);
        }
      } catch (syncError) {
        console.error('[saved] ★ remote sync failed:', syncError);
        // リモート同期失敗はローカルデータで継続
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // プロジェクト選択 → 編集画面（Step 4）から再開
  const handleSelect = (project: SavedProject) => {
    sessionStorage.setItem('currentProject', JSON.stringify(project));
    sessionStorage.setItem('editorElements', JSON.stringify(project.elements));
    sessionStorage.setItem('selectedProducts', JSON.stringify(project.selectedProducts));
    sessionStorage.setItem('taxSettings', JSON.stringify(project.taxSettings));
    if (project.editedProductData) {
      sessionStorage.setItem('editedProductData', JSON.stringify(project.editedProductData));
    }
    // 商品データも復元
    if (project.selectedProducts && project.selectedProducts.length > 0) {
      saveSelectedProducts(project.selectedProducts, project.template.id);
    }
    router.push(`/edit?template=${project.template.id}&project=${project.id}`);
  };

  // プロジェクトを削除
  const handleDelete = async (project: SavedProject) => {
    setDeleteTarget(project);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteProject(deleteTarget.id);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // プロジェクトを複製
  const handleDuplicate = async (project: SavedProject) => {
    const duplicated = await duplicateProject(project.id);
    if (duplicated) {
      setProjects(prev => [duplicated, ...prev]);
    }
  };

  return (
    <main className="min-h-screen bg-background-light">
      <Header />
      <ProgressBar currentStep={1} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-dark mb-2">保存プロジェクト</h1>
            <p className="text-text-muted">
              保存したプロジェクトを呼び出して編集を再開できます
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-text-muted hover:text-text-dark transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            戻る
          </button>
        </div>

        {/* 説明 */}
        {!isLoading && projects.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            プロジェクトを選ぶとデザイン＋商品データが復元され、編集画面から再開します
          </div>
        )}

        {/* プロジェクト一覧 */}
        <ProjectGrid
          projects={projects}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          isLoading={isLoading}
        />

        {!isLoading && projects.length === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/templates')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新しいポップを作成
            </button>
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-2">
                プロジェクトを削除しますか？
              </h3>
              <p className="text-text-muted mb-6">
                「{deleteTarget.name}」を削除します。<br />
                この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-text-dark font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
