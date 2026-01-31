'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { handleAuthCallback } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage('認証がキャンセルされました');
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('認証コードが見つかりません');
        return;
      }

      const result = await handleAuthCallback(code);

      if (result.success) {
        setStatus('success');
        await checkAuthStatus();
        // 2秒後にメイン画面にリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(result.error || '認証に失敗しました');
      }
    };

    processCallback();
  }, [searchParams, router, checkAuthStatus]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      {status === 'processing' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
          <h1 className="text-xl font-bold text-text-dark mb-2">
            認証処理中...
          </h1>
          <p className="text-text-muted">
            スマレジとの連携を確認しています
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-dark mb-2">
            連携完了
          </h1>
          <p className="text-text-muted">
            スマレジとの連携が完了しました。<br />
            まもなくホーム画面に移動します...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-dark mb-2">
            連携に失敗しました
          </h1>
          <p className="text-text-muted mb-6">
            {errorMessage}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth')}
              className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              もう一度試す
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 px-6 bg-background-muted text-text-dark font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
      <h1 className="text-xl font-bold text-text-dark mb-2">
        読み込み中...
      </h1>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-background-light">
      <Header />

      <div className="max-w-md mx-auto px-4 py-16">
        <Suspense fallback={<LoadingFallback />}>
          <AuthCallbackContent />
        </Suspense>
      </div>
    </main>
  );
}
