'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, useMockData, setUseMockData } = useAuth();

  // 既に認証済みの場合はメイン画面にリダイレクト
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background-light">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-light">
      <Header />

      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-dark mb-2">
              スマレジと連携する
            </h1>
            <p className="text-text-muted">
              スマレジアカウントと連携して、商品データを自動で取得できます
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full py-4 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              スマレジに接続
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-text-muted">または</span>
              </div>
            </div>

            <button
              onClick={() => {
                setUseMockData(true);
                router.push('/');
              }}
              className="w-full py-4 px-6 bg-background-muted text-text-dark font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              サンプルデータで試す
            </button>
          </div>

          <div className="mt-8 p-4 bg-background-muted rounded-xl">
            <h3 className="font-semibold text-text-dark mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              連携でできること
            </h3>
            <ul className="text-sm text-text-muted space-y-1">
              <li>・ スマレジの商品データを自動取得</li>
              <li>・ 商品名・価格・カテゴリを自動反映</li>
              <li>・ バーコード・QRコードを商品コードで生成</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-text-muted hover:text-text-dark transition-colors"
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    </main>
  );
}
