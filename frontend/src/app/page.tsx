'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { SavedPop } from '@/types';
import { getSavedPops, deleteSavedPop } from '@/lib/api';

export default function HomePage() {
  const [savedPops, setSavedPops] = useState<SavedPop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedPop | null>(null);

  // 仮のユーザーID（後で認証機能を実装）
  const userId = 'demo-user';

  useEffect(() => {
    loadSavedPops();
  }, []);

  const loadSavedPops = async () => {
    setLoading(true);
    setError(null);

    try {
      const savedRes = await getSavedPops(userId);
      if (savedRes.success && savedRes.data) {
        setSavedPops(savedRes.data);
      }
    } catch (err) {
      console.error('=== Load Saved Pops Error ===', err);
      // エラーは表示せず、空の状態を表示
      setSavedPops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pop: SavedPop) => {
    try {
      const res = await deleteSavedPop(pop.id, userId);
      if (res.success) {
        setSavedPops(savedPops.filter(p => p.id !== pop.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('=== Delete Error ===', err);
      setError('削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/popmate_icon_blue.png" 
              alt="PopMate" 
              width={40} 
              height={40}
              className="bg-white rounded-lg p-1"
            />
            <h1 className="text-xl font-bold text-white">ポップメイト</h1>
          </div>
          <nav className="flex gap-4">
            <Link 
              href="/settings" 
              className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              設定
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* ウェルカムセクション */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            プライスポップを簡単作成
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            スマレジの商品データを使って、プロ品質のプライスポップを数クリックで作成できます
          </p>
        </div>

        {/* メイン選択カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* テンプレートを選ぶ */}
          <Link href="/templates" className="group">
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
              {/* カードヘッダー */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">テンプレートを選ぶ</h3>
                    <p className="text-blue-100 text-sm">既存のテンプレートから作成</p>
                  </div>
                </div>
              </div>
              
              {/* カードボディ */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    プライスポップ
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    A4ポップ
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    A5ポップ
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    A6ポップ
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                    テンプレートを見る
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* 保存データから選ぶ */}
          <div 
            onClick={() => {
              const savedSection = document.getElementById('saved-section');
              savedSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group cursor-pointer"
          >
            <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full">
              {/* カードヘッダー */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">保存データから選ぶ</h3>
                    <p className="text-emerald-100 text-sm">以前作成したデータを編集</p>
                  </div>
                </div>
              </div>
              
              {/* カードボディ */}
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-emerald-600">{savedPops.length}</span>
                  <span className="text-gray-500">件の保存データ</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {savedPops.length > 0 
                    ? '保存したポップデータを編集・印刷できます' 
                    : 'まだ保存データがありません'}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <span className="inline-flex items-center text-emerald-600 font-medium group-hover:gap-2 transition-all">
                    保存データを見る
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 保存データセクション */}
        <section id="saved-section" className="scroll-mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-800">保存データ</h2>
            </div>
            {savedPops.length > 0 && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {savedPops.length}件
              </span>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
                <span className="text-gray-500 text-sm">読み込み中...</span>
              </div>
            </div>
          )}

          {/* 保存データ一覧 - 空の状態 */}
          {!loading && savedPops.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">保存されたデータがありません</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                テンプレートからポップを作成し、保存すると<br />ここに表示されます
              </p>
              <Link href="/templates">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg">
                  テンプレートから作成する
                </button>
              </Link>
            </div>
          )}

          {/* 保存データ一覧 */}
          {!loading && savedPops.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPops.map((pop) => (
                <div 
                  key={pop.id} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100"
                >
                  {/* プレビュー */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative p-4">
                    <div
                      className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm flex items-center justify-center"
                      style={{
                        width: `${Math.min(pop.width_mm * 1.2, 140)}px`,
                        height: `${Math.min(pop.height_mm * 1.2, 100)}px`,
                      }}
                    >
                      <span className="text-gray-400 text-xs font-medium">
                        {pop.width_mm}×{pop.height_mm}mm
                      </span>
                    </div>
                    
                    {/* ホバー時のオーバーレイ */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link href={`/editor?saved=${pop.id}`}>
                        <button className="px-5 py-2.5 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md">
                          編集する
                        </button>
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(pop);
                        }}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-md"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  
                  {/* 情報 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">{pop.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {pop.width_mm}×{pop.height_mm}mm
                      </span>
                      <span className="text-gray-400">
                        {new Date(pop.updated_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 PopMate - プライスポップ作成サービス
        </div>
      </footer>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">削除の確認</h3>
            </div>
            <p className="text-gray-600 mb-6">
              「{deleteTarget.name}」を削除しますか？<br />
              <span className="text-red-500 text-sm">この操作は取り消せません。</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="px-5 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
