'use client';

import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import Link from 'next/link';

// ダミーの保存データ（後でAPIから取得）
const savedPops = [
  {
    id: '1',
    name: '夏季セール用プライスポップ',
    templateName: 'プライスポップ',
    updatedAt: '2024-01-15T10:30:00',
    productCount: 12,
  },
  {
    id: '2',
    name: '新商品案内A4',
    templateName: 'A4サイズ',
    updatedAt: '2024-01-14T15:45:00',
    productCount: 1,
  },
  {
    id: '3',
    name: '店頭用POP',
    templateName: 'A5サイズ',
    updatedAt: '2024-01-10T09:00:00',
    productCount: 6,
  },
];

// 日付フォーマット関数
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SavedPage() {
  const hasSavedData = savedPops.length > 0;

  return (
    <main className="min-h-screen bg-background-light">
      {/* ヘッダー */}
      <Header />

      {/* 進捗バー */}
      <ProgressBar currentStep={1} />

      {/* メインコンテンツ */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 戻るボタン */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>戻る</span>
        </Link>

        {/* タイトルセクション */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            保存データ
          </h2>
          <p className="text-text-muted">
            過去に作成したポップを選んで編集を再開できます
          </p>
        </div>

        {hasSavedData ? (
          /* 保存データリスト */
          <div className="space-y-4">
            {savedPops.map((pop) => (
              <div
                key={pop.id}
                className="bg-white rounded-xl border border-border hover:border-primary hover:shadow-md transition-all duration-300"
              >
                <div className="p-6 flex items-center justify-between">
                  {/* 左側：情報 */}
                  <div className="flex items-center gap-4">
                    {/* アイコン */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    {/* テキスト情報 */}
                    <div>
                      <h3 className="font-bold text-text-dark">{pop.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                        <span>{pop.templateName}</span>
                        <span>•</span>
                        <span>{pop.productCount}商品</span>
                        <span>•</span>
                        <span>{formatDate(pop.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 右側：アクションボタン */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/editor?id=${pop.id}`}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                    >
                      編集
                    </Link>
                    <button
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 空状態 */
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">
              保存データがありません
            </h3>
            <p className="text-text-muted mb-6">
              テンプレートから新しいポップを作成してみましょう
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <span>テンプレートから作成</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
