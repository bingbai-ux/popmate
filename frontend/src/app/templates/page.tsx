'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Template } from '@/types';
import { getSystemTemplates, getUserTemplates } from '@/lib/api';
import StatusBar from '@/components/common/StatusBar';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';

// テンプレートタイプのラベルとアイコン
const templateTypeInfo: Record<string, { label: string; icon: string; description: string }> = {
  price_pop: { 
    label: 'プライスポップ', 
    icon: '🏷️',
    description: '商品の価格表示に最適な小型ポップ'
  },
  a4_pop: { 
    label: 'A4ポップ', 
    icon: '📄',
    description: 'A4サイズ（210×297mm）の大型ポップ'
  },
  a4: { 
    label: 'A4ポップ', 
    icon: '📄',
    description: 'A4サイズ（210×297mm）の大型ポップ'
  },
  a5_pop: { 
    label: 'A5ポップ', 
    icon: '📋',
    description: 'A5サイズ（148×210mm）の中型ポップ'
  },
  a5: { 
    label: 'A5ポップ', 
    icon: '📋',
    description: 'A5サイズ（148×210mm）の中型ポップ'
  },
  a6_pop: { 
    label: 'A6ポップ', 
    icon: '🗒️',
    description: 'A6サイズ（105×148mm）の小型ポップ'
  },
  a6: { 
    label: 'A6ポップ', 
    icon: '🗒️',
    description: 'A6サイズ（105×148mm）の小型ポップ'
  },
  custom: { 
    label: 'カスタム', 
    icon: '✨',
    description: 'サイズを自由に設定できるオリジナルポップ'
  },
};

// テンプレートのプレビューコンポーネント
function TemplateCard({ template, isSelected, onClick, onPreview }: {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
  onPreview: () => void;
}) {
  const info = templateTypeInfo[template.type] || templateTypeInfo.custom;
  
  // プレビューのスケール計算
  const maxWidth = 100;
  const maxHeight = 130;
  const scale = Math.min(maxWidth / template.width_mm, maxHeight / template.height_mm);
  const previewWidth = template.width_mm * scale;
  const previewHeight = template.height_mm * scale;

  return (
    <div
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-200 group
        ${isSelected 
          ? 'bg-primary/10 border-2 border-primary shadow-md' 
          : 'bg-white border-2 border-transparent hover:border-gray-200 hover:shadow-md'
        }
      `}
    >
      {/* メインクリックエリア */}
      <div onClick={onClick}>
        {/* プレビュー */}
        <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center relative overflow-hidden">
          <div
            className="bg-white border border-gray-300 shadow-sm flex items-center justify-center"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
            }}
          >
            <span className="text-xl">{info.icon}</span>
          </div>
          
          {/* ホバー時のプレビューボタン */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="px-3 py-1.5 bg-white text-gray-800 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              プレビュー
            </button>
          </div>
        </div>
        
        {/* 情報 */}
        <h3 className="font-medium text-sm mb-0.5 truncate">{template.name}</h3>
        <p className="text-xs text-gray-500 mb-0.5">{info.label}</p>
        <p className="text-xs text-gray-400">
          {template.width_mm}×{template.height_mm}mm
        </p>
      </div>
      
      {/* 選択インジケーター */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

// カスタムサイズ作成コンポーネント
function CustomSizeCreator({ onSelect }: { onSelect: (width: number, height: number) => void }) {
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(40);

  // プリセットサイズ
  const presets = [
    { name: '名刺サイズ', width: 91, height: 55 },
    { name: 'カードサイズ', width: 85.6, height: 54 },
    { name: 'はがきサイズ', width: 100, height: 148 },
    { name: 'A7', width: 74, height: 105 },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <h3 className="font-bold text-lg">カスタムサイズで作成</h3>
          <p className="text-sm text-gray-500">サイズを自由に設定できます</p>
        </div>
      </div>

      {/* プリセット */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 mb-2">プリセットサイズ</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setWidth(preset.width);
                setHeight(preset.height);
              }}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* サイズ入力 */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4 items-center">
          <label className="text-sm text-gray-600 w-16">幅</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            min={10}
            max={297}
            step={0.1}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-gray-500 w-8">mm</span>
        </div>
        <div className="flex gap-4 items-center">
          <label className="text-sm text-gray-600 w-16">高さ</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={10}
            max={420}
            step={0.1}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-gray-500 w-8">mm</span>
        </div>
      </div>

      {/* プレビュー */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="text-xs text-gray-500 mb-2 text-center">プレビュー</p>
        <div className="flex justify-center">
          <div
            className="bg-white border border-gray-300 shadow-sm flex items-center justify-center"
            style={{
              width: `${Math.min(width * 1.5, 150)}px`,
              height: `${Math.min(height * 1.5, 200)}px`,
            }}
          >
            <span className="text-gray-400 text-xs">{width}×{height}mm</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSelect(width, height)}
        className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        このサイズで作成 →
      </button>
    </div>
  );
}

// フォールバックテンプレート（APIが失敗した場合に使用）
const fallbackTemplates: Template[] = [
  {
    id: 'fallback-price-pop',
    user_id: undefined,
    name: 'プライスポップ（標準）',
    type: 'price_pop',
    width_mm: 65,
    height_mm: 45,
    design_data: { elements: [], background_color: '#FFFFFF' },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-a4',
    user_id: undefined,
    name: 'A4ポップ',
    type: 'a4',
    width_mm: 210,
    height_mm: 297,
    design_data: { elements: [], background_color: '#FFFFFF' },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-a5',
    user_id: undefined,
    name: 'A5ポップ',
    type: 'a5',
    width_mm: 148,
    height_mm: 210,
    design_data: { elements: [], background_color: '#FFFFFF' },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fallback-a6',
    user_id: undefined,
    name: 'A6ポップ',
    type: 'a6',
    width_mm: 105,
    height_mm: 148,
    design_data: { elements: [], background_color: '#FFFFFF' },
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(fallbackTemplates);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'system' | 'user' | 'custom'>('system');

  // 仮のユーザーID
  const userId = 'demo-user';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      // システムテンプレートを取得
      const systemRes = await getSystemTemplates();
      if (systemRes.success && systemRes.data && systemRes.data.length > 0) {
        setTemplates(systemRes.data);
      }
      // APIが失敗してもフォールバックテンプレートが表示される

      // ユーザーテンプレートを取得（オプショナル）
      try {
        const userRes = await getUserTemplates(userId);
        if (userRes.success && userRes.data) {
          setUserTemplates(userRes.data);
        }
      } catch (userErr) {
        console.warn('User templates not loaded:', userErr);
      }
    } catch (err) {
      console.error('=== Load Templates Error ===', err);
      // フォールバックテンプレートがあるのでエラーメッセージは表示しない
      // setError('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleProceed = () => {
    if (selectedTemplate) {
      router.push(`/editor?template=${selectedTemplate.id}`);
    }
  };

  const handleCustomCreate = (width: number, height: number) => {
    router.push(`/editor?new=true&width=${width}&height=${height}`);
  };

  const handlePreviewSelect = () => {
    if (previewTemplate) {
      router.push(`/editor?template=${previewTemplate.id}`);
    }
  };

  // テンプレートをタイプ別にグループ化
  const groupedTemplates = templates.reduce((acc, template) => {
    const type = template.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  // タイプの表示順序
  const typeOrder = ['price_pop', 'a4_pop', 'a4', 'a5_pop', 'a5', 'a6_pop', 'a6', 'custom'];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-bold text-gray-800">ポップメイト</span>
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors">
              ホーム
            </Link>
          </nav>
        </div>
      </header>

      {/* ステータスバー */}
      <StatusBar
        currentStep="template"
        onStepClick={() => {}}
        completedSteps={[]}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">テンプレートを選択</h1>
          <p className="text-gray-600">作成したいポップのテンプレートを選んでください</p>
        </div>

        {/* カテゴリタブ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('system')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'system'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            既存テンプレート
          </button>
          <button
            onClick={() => setActiveCategory('user')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'user'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            オリジナルデータ
            {userTemplates.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {userTemplates.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'custom'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            新規作成
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

        {/* システムテンプレート */}
        {!loading && activeCategory === 'system' && (
          <div className="space-y-8">
            {typeOrder.map((type) => {
              const typeTemplates = groupedTemplates[type];
              if (!typeTemplates || typeTemplates.length === 0) return null;
              
              const info = templateTypeInfo[type] || templateTypeInfo.custom;
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{info.icon}</span>
                    <h2 className="text-lg font-bold">{info.label}</h2>
                    <span className="text-sm text-gray-500 hidden sm:inline">- {info.description}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {typeTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate?.id === template.id}
                        onClick={() => handleSelectTemplate(template)}
                        onPreview={() => setPreviewTemplate(template)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {templates.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                テンプレートがありません
              </div>
            )}
          </div>
        )}

        {/* ユーザーテンプレート（オリジナルデータ） */}
        {!loading && activeCategory === 'user' && (
          <div>
            {userTemplates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📁</span>
                </div>
                <p className="text-gray-500 mb-4">オリジナルデータがありません</p>
                <button
                  onClick={() => setActiveCategory('custom')}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  新規作成する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {userTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onClick={() => handleSelectTemplate(template)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* カスタムサイズ作成 */}
        {!loading && activeCategory === 'custom' && (
          <div className="max-w-md">
            <CustomSizeCreator onSelect={handleCustomCreate} />
          </div>
        )}

        {/* 選択時の下部スペーサー */}
        {selectedTemplate && activeCategory !== 'custom' && (
          <div className="h-24" />
        )}
      </main>

      {/* 選択時のフローティングボタン */}
      {selectedTemplate && activeCategory !== 'custom' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">
                  {templateTypeInfo[selectedTemplate.type]?.icon || '📄'}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedTemplate.width_mm}×{selectedTemplate.height_mm}mm
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewTemplate(selectedTemplate)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              >
                プレビュー
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleProceed}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                作成 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プレビューモーダル */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={handlePreviewSelect}
        />
      )}
    </div>
  );
}
