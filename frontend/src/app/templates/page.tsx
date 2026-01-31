'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import Link from 'next/link';
import { CustomTemplate, getAllTemplates, deleteCustomTemplate } from '@/types/template';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(getAllTemplates());
  }, []);

  const handleDelete = (id: string) => {
    if (deleteCustomTemplate(id)) {
      setTemplates(getAllTemplates());
    }
    setDeleteConfirm(null);
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

        {/* 削除確認モーダル */}
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
      </div>
    </main>
  );
}
