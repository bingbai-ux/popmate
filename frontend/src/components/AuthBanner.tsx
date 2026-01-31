'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AuthBannerProps {
  className?: string;
}

export default function AuthBanner({ className = '' }: AuthBannerProps) {
  const { isAuthenticated, useMockData, setUseMockData } = useAuth();

  // 認証済みの場合は表示しない
  if (isAuthenticated && !useMockData) {
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
              : 'スマレジと連携すると、商品データを自動で取得できます。'
            }
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              スマレジに接続
            </Link>
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
