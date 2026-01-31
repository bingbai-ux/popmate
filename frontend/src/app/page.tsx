'use client';

import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import SelectionCard from '@/components/SelectionCard';

const TEXT_DARK = '#0A1628';
const TEXT_MUTED = '#6B7280';
const BACKGROUND_MUTED = '#EFF6FF';
const BORDER_COLOR = '#E5E7EB';

export default function Home() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <Header />
      <ProgressBar currentStep={1} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: TEXT_DARK }}>
            ポップを作成しましょう
          </h2>
          <p style={{ color: TEXT_MUTED }}>
            テンプレートから新規作成するか、保存したデータから編集を再開できます
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <SelectionCard
            title="テンプレートから選ぶ"
            description="プライスポップ、A4、A5、A6サイズのテンプレートから選んで新規作成"
            href="/templates"
            variant="primary"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            }
          />

          <SelectionCard
            title="保存データから選ぶ"
            description="過去に作成・保存したポップデータから選んで編集を再開"
            href="/saved"
            variant="secondary"
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
        </div>

        <div className="mt-16 text-center">
          <div 
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full"
            style={{ color: TEXT_MUTED, backgroundColor: BACKGROUND_MUTED }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>スマレジと連携して商品データを自動取得できます</span>
          </div>
        </div>
      </div>

      <footer className="mt-auto py-6 border-t" style={{ borderColor: BORDER_COLOR }}>
        <div className="max-w-7xl mx-auto px-4 text-center text-sm" style={{ color: TEXT_MUTED }}>
          <p>© 2024 PopMate - ポップメイト</p>
        </div>
      </footer>
    </main>
  );
}
