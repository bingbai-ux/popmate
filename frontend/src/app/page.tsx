'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SavedPop } from '@/types';
import { getSavedPops, deleteSavedPop } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
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
      setError('データの読み込みに失敗しました');
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">ポップメイト</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/settings" className="text-gray-600 hover:text-primary transition-colors">
              設定
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* メイン選択ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* テンプレートを選ぶ */}
          <Link href="/templates">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 cursor-pointer border-2 border-transparent hover:border-primary">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">テンプレートを選ぶ</h2>
                  <p className="text-gray-500">既存のテンプレートから作成</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">プライスポップ</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">A4ポップ</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">A5ポップ</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">A6ポップ</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">カスタム</span>
              </div>
            </div>
          </Link>

          {/* 保存データから選ぶ */}
          <div 
            onClick={() => {
              const savedSection = document.getElementById('saved-section');
              savedSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 cursor-pointer border-2 border-transparent hover:border-secondary"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="text-3xl">💾</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">保存データから選ぶ</h2>
                <p className="text-gray-500">以前作成したデータを編集</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-secondary">{savedPops.length}</span>
              <span className="text-gray-500">件の保存データ</span>
            </div>
          </div>
        </div>

        {/* 保存データセクション */}
        <section id="saved-section" className="scroll-mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">保存データ</h2>
            {savedPops.length > 0 && (
              <span className="text-sm text-gray-500">{savedPops.length}件</span>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* ローディング */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* 保存データ一覧 */}
          {!loading && savedPops.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📭</span>
              </div>
              <p className="text-gray-500 mb-4">保存されたデータがありません</p>
              <Link href="/templates">
                <button className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  テンプレートから作成する
                </button>
              </Link>
            </div>
          )}

          {!loading && savedPops.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPops.map((pop) => (
                <div 
                  key={pop.id} 
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  {/* プレビュー */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                    <div
                      className="bg-white border border-gray-300 shadow-sm flex items-center justify-center"
                      style={{
                        width: `${Math.min(pop.width_mm * 1.5, 120)}px`,
                        height: `${Math.min(pop.height_mm * 1.5, 80)}px`,
                      }}
                    >
                      <span className="text-gray-400 text-xs">
                        {pop.width_mm}×{pop.height_mm}mm
                      </span>
                    </div>
                    
                    {/* ホバー時のオーバーレイ */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Link href={`/editor?saved=${pop.id}`}>
                        <button className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                          編集
                        </button>
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(pop);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  
                  {/* 情報 */}
                  <div className="p-4">
                    <h3 className="font-medium mb-1 truncate">{pop.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {pop.width_mm}×{pop.height_mm}mm
                    </p>
                    <p className="text-xs text-gray-400">
                      更新日: {new Date(pop.updated_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-2">削除の確認</h3>
            <p className="text-gray-600 mb-4">
              「{deleteTarget.name}」を削除しますか？<br />
              この操作は取り消せません。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
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
