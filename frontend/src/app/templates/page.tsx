'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import Link from 'next/link';
import { CustomTemplate, getAllTemplates, deleteCustomTemplate, fetchAndMergeRemoteTemplates, DEFAULT_TEMPLATES, ensureTemplateRegistered } from '@/types/template';
import { SavedProject } from '@/types/project';
import { getSavedTemplates, deleteProject, duplicateProject } from '@/lib/projectStorage';
import { saveEditorState } from '@/lib/editorStorage';
import { syncService } from '@/lib/syncService';
import { getUserId } from '@/lib/userIdentity';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedProject[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteSavedConfirm, setDeleteSavedConfirm] = useState<SavedProject | null>(null);

  const loadData = useCallback(async () => {
    // まずローカルデータを即座に表示
    setTemplates(getAllTemplates());
    const saved = await getSavedTemplates();
    setSavedTemplates(saved);

    // バックエンドからリモートデータをマージ（非同期）
    try {
      await getUserId(); // ユーザーIDをキャッシュ
      const mergedTemplates = await fetchAndMergeRemoteTemplates();
      setTemplates([...DEFAULT_TEMPLATES, ...mergedTemplates]);

      // 保存テンプレートもリモートから同期
      try {
        const imported = await syncService.pullFromRemote();
        console.log('[templates] ★ pull imported:', imported, 'records');
        if (imported > 0) {
          const refreshed = await getSavedTemplates();
          console.log('[templates] ★ refreshed saved templates:', refreshed.length);
          setSavedTemplates(refreshed);
        }
      } catch (syncError) {
        console.error('[templates] ★ remote sync failed:', syncError);
        // リモート同期失敗はローカルデータで継続
      }
    } catch {
      // リモート取得失敗はローカルデータで継続
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (id: string) => {
    if (deleteCustomTemplate(id)) {
      setTemplates(getAllTemplates());
    }
    setDeleteConfirm(null);
  };

  // 保存テンプレートを選択 → エディター画面へ
  const handleSelectSavedTemplate = (project: SavedProject) => {
    // カスタムテンプレートをlocalStorageに登録（別PCで開いた場合の対策）
    ensureTemplateRegistered(project.template);
    saveEditorState({
      elements: project.elements,
      templateId: project.template.id,
      templateName: project.template.name,
      templateWidth: project.template.width,
      templateHeight: project.template.height,
      zoom: 1,
      roundingMethod: project.taxSettings?.roundingMode || 'floor',
    });
    router.push(`/editor?template=${project.template.id}`);
  };

  // 保存テンプレートを削除
  const handleDeleteSaved = async () => {
    if (!deleteSavedConfirm) return;
    const success = await deleteProject(deleteSavedConfirm.id);
    if (success) {
      setSavedTemplates(prev => prev.filter(p => p.id !== deleteSavedConfirm.id));
    }
    setDeleteSavedConfirm(null);
  };

  // 保存テンプレートを複製
  const handleDuplicateSaved = async (project: SavedProject) => {
    const duplicated = await duplicateProject(project.id);
    if (duplicated) {
      setSavedTemplates(prev => [duplicated, ...prev]);
    }
  };

  return (
    <main className="min-h-screen bg-background-light">
      <Header />
      <ProgressBar currentStep={2} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>戻る</span>
        </Link>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-4">テンプレートを選択</h2>
          <p className="text-text-muted">作成したいポップのサイズを選んでください</p>
        </div>

        {/* 保存されたテンプレート */}
        {savedTemplates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-dark">保存テンプレート</h3>
                <p className="text-sm text-text-muted">作成・保存したデザインテンプレート</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedTemplates.map((project) => (
                <div key={project.id} className="relative group">
                  <button
                    onClick={() => handleSelectSavedTemplate(project)}
                    className="w-full text-left bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 overflow-hidden transition-all duration-300 hover:shadow-lg"
                  >
                    {/* サムネイル */}
                    <div className="relative aspect-[4/3] bg-gray-50">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* バッジ */}
                      <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        テンプレート
                      </span>
                    </div>
                    {/* 情報 */}
                    <div className="p-4">
                      <h4 className="font-bold text-text-dark mb-1 truncate">{project.name}</h4>
                      <p className="text-sm text-primary font-medium mb-1">
                        {project.template.name} ({project.template.width}×{project.template.height}mm)
                      </p>
                      <p className="text-xs text-text-muted">
                        更新: {new Date(project.updatedAt).toLocaleDateString('ja-JP')} {new Date(project.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {/* 選択ボタン */}
                      <div className="mt-3 flex items-center justify-center gap-1 text-purple-600 bg-purple-50 py-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <span className="text-sm font-medium">デザインを使う</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* アクションボタン */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 複製 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSaved(project);
                      }}
                      className="p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="複製"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {/* 削除 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteSavedConfirm(project);
                      }}
                      className="p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* サイズテンプレート（システムテンプレート） */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-dark">サイズテンプレート</h3>
              <p className="text-sm text-text-muted">白紙のテンプレートから新規作成</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="relative group">
                <Link
                  href={`/editor?template=${template.id}`}
                  className="block bg-white rounded-xl border-2 border-border hover:border-primary p-6 transition-all duration-300 hover:shadow-lg"
                >
                  {/* アイコン */}
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {template.isSystem ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )}
                  </div>

                  {/* テンプレート名 */}
                  <h3 className="text-lg font-bold text-text-dark mb-1">
                    {template.name}
                  </h3>

                  {/* サイズ */}
                  <p className="text-sm text-primary font-medium mb-2">
                    {template.width}mm × {template.height}mm
                  </p>

                  {/* 説明 */}
                  <p className="text-sm text-text-muted">
                    {template.description || 'カスタムテンプレート'}
                  </p>

                  {/* カスタムバッジ */}
                  {!template.isSystem && (
                    <span className="absolute top-2 right-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      カスタム
                    </span>
                  )}

                  {/* 選択矢印 */}
                  <div className="mt-4 flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">選択</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {/* 削除ボタン（カスタムテンプレートのみ） */}
                {!template.isSystem && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirm(template.id);
                    }}
                    className="absolute top-2 left-2 p-1.5 bg-white rounded-full shadow-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 削除確認モーダル（カスタムサイズテンプレート） */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-text-dark mb-2">
                テンプレートを削除
              </h3>
              <p className="text-text-muted mb-6">
                このテンプレートを削除してもよろしいですか？この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 px-4 border border-border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 削除確認モーダル（保存テンプレート） */}
        {deleteSavedConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-text-dark mb-2">
                保存テンプレートを削除
              </h3>
              <p className="text-text-muted mb-6">
                「{deleteSavedConfirm.name}」を削除してもよろしいですか？<br />
                この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteSavedConfirm(null)}
                  className="flex-1 py-2 px-4 border border-border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteSaved}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
