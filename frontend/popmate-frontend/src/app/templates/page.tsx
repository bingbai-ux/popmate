'use client';

import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import Link from 'next/link';

// テンプレートの種類
const templates = [
  {
    id: 'price-pop',
    name: 'プライスポップ',
    description: '価格表示に最適な定番サイズ',
    size: '91mm × 55mm',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 'a4',
    name: 'A4サイズ',
    description: '大きな掲示物やポスターに',
    size: '210mm × 297mm',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'a5',
    name: 'A5サイズ',
    description: '棚札やミニポスターに最適',
    size: '148mm × 210mm',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'a6',
    name: 'A6サイズ',
    description: 'コンパクトな商品タグに',
    size: '105mm × 148mm',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-background-light">
      {/* ヘッダー */}
      <Header />

      {/* 進捗バー */}
      <ProgressBar currentStep={2} />

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
            テンプレートを選択
          </h2>
          <p className="text-text-muted">
            作成したいポップのサイズを選んでください
          </p>
        </div>

        {/* テンプレートグリッド */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/editor?template=${template.id}`}
              className="group bg-white rounded-xl border-2 border-border hover:border-primary p-6 transition-all duration-300 hover:shadow-lg"
            >
              {/* アイコン */}
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                {template.icon}
              </div>

              {/* テンプレート名 */}
              <h3 className="text-lg font-bold text-text-dark mb-1">
                {template.name}
              </h3>

              {/* サイズ */}
              <p className="text-sm text-primary font-medium mb-2">
                {template.size}
              </p>

              {/* 説明 */}
              <p className="text-sm text-text-muted">
                {template.description}
              </p>

              {/* 選択矢印 */}
              <div className="mt-4 flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">選択</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* オリジナルサイズ */}
        <div className="mt-8 text-center">
          <Link
            href="/editor?template=custom"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>オリジナルサイズで作成</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
