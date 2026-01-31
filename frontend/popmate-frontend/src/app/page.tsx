'use client';

import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import SelectionCard from '@/components/SelectionCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-background-light">
      {/* ヘッダー */}
      <Header />

      {/* 進捗バー */}
      <ProgressBar currentStep={1} />

      {/* メインコンテンツ */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* タイトルセクション */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            ポップを作成しましょう
          </h2>
          <p className="text-text-muted">
            テンプレートから新規作成するか、保存したデータから編集を再開できます
          </p>
        </div>

        {/* 選択カード */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* テンプレートから選ぶ */}
          <SelectionCard
            title="テンプレートから選ぶ"
            description="プライスポップ、A4、A5、A6サイズのテンプレートから選んで新規作成"
            href="/templates"
            variant="primary"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            }
          />

          {/* 保存データから選ぶ */}
          <SelectionCard
            title="保存データから選ぶ"
            description="過去に作成・保存したポップデータから選んで編集を再開"
            href="/saved"
            variant="secondary"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            }
          />
        </div>

        {/* 補足情報 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-text-muted bg-background-muted px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>スマレジと連携して商品データを自動取得できます</span>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="mt-auto py-6 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-text-muted">
          <p>© 2024 PopMate - ポップメイト</p>
        </div>
      </footer>
    </main>
  );
}
