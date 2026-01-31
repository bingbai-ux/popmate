'use client';

import { useAuth } from '@/contexts/AuthContext';

interface AuthBannerProps {
  className?: string;
}

export default function AuthBanner({ className = '' }: AuthBannerProps) {
  const { isConnected, isLoading, message, useMockData, checkConnection } = useAuth();

  // ローディング中は表示しない
  if (isLoading) {
    return null;
  }

  // 接続済みでモックデータを使用していない場合は表示しない
  if (isConnected && !useMockData) {
    return null;
  }

  return (
    <div className={`bg-primary/5 border border-primary/20 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-dark mb-1">
            {useMockData ? 'サンプルデータを使用中' : 'スマレジと連携していません'}
          </h3>
          <p className="text-sm text-text-muted mb-3">
            {useMockData 
              ? '現在はサンプルデータを表示しています。スマレジと連携すると、実際の商品データを取得できます。'
              : message || 'スマレジと連携すると、商品データを自動で取得できます。'
            }
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => checkConnection()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              接続を確認
            </button>
            {useMockData && (
              <span className="text-xs text-text-muted">
                サンプルデータで続行中
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
