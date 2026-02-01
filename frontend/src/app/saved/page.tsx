'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import ProjectGrid from '@/components/saved/ProjectGrid';
import { SavedProject, SaveType } from '@/types/project';
import { getProjects, deleteProject, duplicateProject } from '@/lib/projectStorage';
import { saveEditorState } from '@/lib/editorStorage';
import { saveSelectedProducts } from '@/lib/selectedProductsStorage';

export default function SavedPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedProject | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'template' | 'project'>('all');

  // プロジェクト一覧を取得
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProjects({ sortBy: 'updatedAt', sortOrder: 'desc' });
      // saveType が未定義の古いレコードを正規化
      const normalized = data.map(p => ({
        ...p,
        saveType: p.saveType || ('project' as const),
      }));
      console.log('[saved] ★ loaded projects:', normalized.map(p => ({ id: p.id, name: p.name, saveType: p.saveType })));
      setProjects(normalized);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // タブで絞り込まれたリスト
  const filteredProjects = projects.filter(p => {
    const type = p.saveType || 'project';
    if (activeTab === 'all') return true;
    if (activeTab === 'template') return type === 'template';
    if (activeTab === 'project') return type === 'project';
    return true;
  });

  const templateCount = projects.filter(p => (p.saveType || 'project') === 'template').length;
  const projectCount = projects.filter(p => (p.saveType || 'project') === 'project').length;

  // テンプレート選択 → エディター画面（Step 2）から開始
  const handleSelectTemplate = (project: SavedProject) => {
    // エディタ状態にデザイン要素を書き込む
    saveEditorState({
      elements: project.elements,
      templateId: project.template.id,
      zoom: 1,
      roundingMethod: project.taxSettings?.roundingMode || 'floor',
    });
    // エディターへ遷移（デザインが復元される）
    router.push(`/editor?template=${project.template.id}`);
  };

  // プロジェクト選択 → 編集画面（Step 4）から再開
  const handleSelectProject = (project: SavedProject) => {
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

  // 選択ハンドラ（タイプに応じて分岐）
  const handleSelect = (project: SavedProject) => {
    if (project.saveType === 'template') {
      handleSelectTemplate(project);
    } else {
      handleSelectProject(project);
    }
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

  const tabs = [
    { key: 'all' as const, label: 'すべて', count: projects.length },
    { key: 'template' as const, label: 'テンプレート', count: templateCount },
    { key: 'project' as const, label: 'プロジェクト', count: projectCount },
  ];

  return (
    <main className="min-h-screen bg-background-light">
      <Header />
      <ProgressBar currentStep={1} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-dark mb-2">保存データ</h1>
            <p className="text-text-muted">
              保存したテンプレートやプロジェクトを呼び出せます
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

        {/* タブ */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${
                activeTab === tab.key ? 'text-primary' : 'text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 説明 */}
        {activeTab === 'template' && !isLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2.5 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            テンプレートを選ぶとデザイン画面から開始します。商品は後から選べます
          </div>
        )}
        {activeTab === 'project' && !isLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            プロジェクトを選ぶとデザイン＋商品データが復元され、編集画面から再開します
          </div>
        )}

        {/* プロジェクト一覧 */}
        <ProjectGrid
          projects={filteredProjects}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          isLoading={isLoading}
        />

        {/* 空の場合のCTA */}
        {!isLoading && filteredProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>{activeTab === 'template' ? '保存されたテンプレートはありません' : '保存されたプロジェクトはありません'}</p>
          </div>
        )}

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
                {deleteTarget.saveType === 'template' ? 'テンプレート' : 'プロジェクト'}を削除しますか？
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
