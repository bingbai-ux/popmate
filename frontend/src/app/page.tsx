'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Template, SavedPop } from '@/types';
import { getSystemTemplates, getSavedPops } from '@/lib/api';
import TemplateCard from '@/components/templates/TemplateCard';

type MainTab = 'templates' | 'saved';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MainTab>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [savedPops, setSavedPops] = useState<SavedPop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 仮のユーザーID（後で認証機能を実装）
  const userId = 'demo-user';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // システムテンプレートを取得
      const templatesRes = await getSystemTemplates();
      if (templatesRes.success && templatesRes.data) {
        setTemplates(templatesRes.data);
      }

      // 保存データを取得
      const savedRes = await getSavedPops(userId);
      if (savedRes.success && savedRes.data) {
        setSavedPops(savedRes.data);
      }
    } catch (err) {
      console.error('=== Load Data Error ===', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <Link href="/settings" className="text-gray-600 hover:text-primary">
              設定
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* タブ切り替え */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            テンプレートを選ぶ
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'saved'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            保存データから選ぶ
          </button>
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

        {/* テンプレート選択 */}
        {!loading && activeTab === 'templates' && (
          <div>
            {/* 既存テンプレート */}
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4">既存テンプレート</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {templates.map((template) => (
                  <Link
                    key={template.id}
                    href={`/editor?template=${template.id}`}
                  >
                    <TemplateCard
                      template={template}
                      isSelected={false}
                      onClick={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </section>

            {/* 新規作成 */}
            <section>
              <h2 className="text-lg font-bold mb-4">新規作成</h2>
              <Link href="/editor?new=true">
                <div className="card inline-flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary text-2xl">+</span>
                  </div>
                  <div>
                    <h3 className="font-medium">カスタムサイズで作成</h3>
                    <p className="text-sm text-gray-500">
                      サイズを自由に設定できます
                    </p>
                  </div>
                </div>
              </Link>
            </section>
          </div>
        )}

        {/* 保存データ */}
        {!loading && activeTab === 'saved' && (
          <div>
            {savedPops.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">保存されたデータがありません</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="btn-primary"
                >
                  テンプレートから作成する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPops.map((pop) => (
                  <Link key={pop.id} href={`/editor?saved=${pop.id}`}>
                    <div className="card cursor-pointer hover:shadow-md transition-shadow">
                      <h3 className="font-medium mb-2">{pop.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {pop.width_mm}×{pop.height_mm}mm
                      </p>
                      <p className="text-xs text-gray-400">
                        更新日: {new Date(pop.updated_at).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
