'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import { saveCustomTemplate } from '@/types/template';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('100.0');
  const [height, setHeight] = useState('100.0');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!name.trim()) {
      setError('テンプレート名を入力してください');
      return;
    }

    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (isNaN(widthNum) || widthNum <= 0 || widthNum > 1000) {
      setError('幅は0.1〜1000mmの範囲で入力してください');
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 1000) {
      setError('高さは0.1〜1000mmの範囲で入力してください');
      return;
    }

    // 保存
    const newTemplate = saveCustomTemplate({
      name: name.trim(),
      description: description.trim(),
      width: Math.round(widthNum * 10) / 10, // 0.1mm単位に丸める
      height: Math.round(heightNum * 10) / 10,
    });

    // エディターへ遷移
    router.push(`/editor?template=${newTemplate.id}`);
  };

  return (
    <main className="min-h-screen bg-background-light">
      <Header />
      <ProgressBar currentStep={1} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* 戻るリンク */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>戻る</span>
        </Link>

        {/* タイトル */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-dark mb-2">
            新規テンプレートを作成
          </h2>
          <p className="text-text-muted">
            オリジナルサイズのテンプレートを作成できます
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-6">
          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* テンプレート名 */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 店頭POP大"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              maxLength={50}
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              説明（任意）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 店頭ディスプレイ用の大きめサイズ"
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              maxLength={100}
            />
          </div>

          {/* サイズ */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              サイズ <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">幅 (mm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="1000"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <span className="text-gray-400 mt-5">×</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">高さ (mm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="1000"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 0.1mm単位で指定できます（最大1000mm）
            </p>
          </div>

          {/* プレビュー */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">プレビュー</p>
            <div className="flex items-center justify-center h-32">
              <div
                className="bg-white border-2 border-primary/30 rounded shadow-sm flex items-center justify-center text-xs text-gray-400"
                style={{
                  width: `${Math.min(parseFloat(width) || 100, 150)}px`,
                  height: `${Math.min(parseFloat(height) || 100, 100)}px`,
                }}
              >
                {width} × {height} mm
              </div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 py-3 px-4 border border-border rounded-lg text-center text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              作成してエディターへ
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
