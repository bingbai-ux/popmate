'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Template } from '@/types';
import { getSystemTemplates, getUserTemplates } from '@/lib/api';
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal';

// テンプレートタイプのラベルとアイコン
const templateTypeInfo: Record<string, { label: string; icon: string; description: string; color: string }> = {
  price_pop: { 
    label: 'プライスポップ', 
    icon: '🏷️',
    description: '商品の価格表示に最適な小型ポップ',
    color: 'from-amber-500 to-orange-500'
  },
  a4_pop: { 
    label: 'A4ポップ', 
    icon: '📄',
    description: 'A4サイズ（210×297mm）の大型ポップ',
    color: 'from-blue-500 to-indigo-500'
  },
  a4: { 
    label: 'A4ポップ', 
    icon: '📄',
    description: 'A4サイズ（210×297mm）の大型ポップ',
    color: 'from-blue-500 to-indigo-500'
  },
  a5_pop: { 
    label: 'A5ポップ', 
    icon: '📋',
    description: 'A5サイズ（148×210mm）の中型ポップ',
    color: 'from-emerald-500 to-teal-500'
  },
  a5: { 
    label: 'A5ポップ', 
    icon: '📋',
    description: 'A5サイズ（148×210mm）の中型ポップ',
    color: 'from-emerald-500 to-teal-500'
  },
  a6_pop: { 
    label: 'A6ポップ', 
    icon: '🗒️',
    description: 'A6サイズ（105×148mm）の小型ポップ',
    color: 'from-purple-500 to-pink-500'
  },
  a6: { 
    label: 'A6ポップ', 
    icon: '🗒️',
    description: 'A6サイズ（105×148mm）の小型ポップ',
    color: 'from-purple-500 to-pink-500'
  },
  custom: { 
    label: 'カスタム', 
    icon: '✨',
    description: 'サイズを自由に設定できるオリジナルポップ',
    color: 'from-gray-500 to-gray-600'
  },
};

// ステップの定義
const steps = [
  { id: 1, label: 'テンプレート', active: true },
  { id: 2, label: 'デザイン', active: false },
  { id: 3, label: 'データ選択', active: false },
  { id: 4, label: 'プレビュー', active: false },
  { id: 5, label: '印刷', active: false },
];

// テンプレートのプレビューコンポーネント
function TemplateCard({ template, isSelected, onClick, onPreview }: {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
  onPreview: () => void;
}) {
  const info = templateTypeInfo[template.type] || templateTypeInfo.custom;
  
  // プレビューのスケール計算
  const maxWidth = 80;
  const maxHeight = 100;
  const scale = Math.min(maxWidth / template.width_mm, maxHeight / template.height_mm);
  const previewWidth = template.width_mm * scale;
  const previewHeight = template.height_mm * scale;

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group
        ${isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02]' 
          : 'hover:shadow-lg hover:scale-[1.01] border border-gray-100'
        }
      `}
    >
      {/* カードヘッダー */}
      <div className={`bg-gradient-to-r ${info.color} p-3`}>
        <div className="flex items-center justify-between">
          <span className="text-2xl">{info.icon}</span>
          <span className="text-white/90 text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
            {template.width_mm}×{template.height_mm}mm
          </span>
        </div>
      </div>
      
      {/* プレビューエリア */}
      <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[100px]">
        <div
          className="bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center shadow-sm"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
          }}
        >
          <span className="text-gray-400 text-[10px]">{template.width_mm}×{template.height_mm}</span>
        </div>
      </div>
      
      {/* 情報エリア */}
      <div className="p-3 border-t border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm mb-0.5 truncate">{template.name}</h3>
        <p className="text-xs text-gray-500">{info.label}</p>
      </div>
      
      {/* 選択インジケーター */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* ホバー時のオーバーレイ */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
    </div>
  );
}

// カスタムサイズ作成コンポーネント
function CustomSizeCreator({ onSelect }: { onSelect: (width: number, height: number) => void }) {
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(40);

  // プリセットサイズ
  const presets = [
    { name: '名刺サイズ', width: 91, height: 55, icon: '💳' },
    { name: 'カードサイズ', width: 85.6, height: 54, icon: '🎴' },
    { name: 'はがきサイズ', width: 100, height: 148, icon: '📮' },
    { name: 'A7', width: 74, height: 105, icon: '📝' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">カスタムサイズで作成</h3>
          <p className="text-sm text-gray-500">サイズを自由に設定できます</p>
        </div>
      </div>

      {/* プリセット */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 mb-3">プリセットサイズ</p>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setWidth(preset.width);
                setHeight(preset.height);
              }}
              className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm transition-colors border border-gray-100 hover:border-blue-200"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* サイズ入力 */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium text-gray-600 w-12">幅</label>
          <div className="flex-1 relative">
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={10}
              max={297}
              step={0.1}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">mm</span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium text-gray-600 w-12">高さ</label>
          <div className="flex-1 relative">
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={10}
              max={420}
              step={0.1}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">mm</span>
          </div>
        </div>
      </div>

      {/* プレビュー */}
      <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <p className="text-xs text-gray-500 mb-3 text-center font-medium">プレビュー</p>
        <div className="flex justify-center">
          <div
            className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm flex items-center justify-center"
            style={{
              width: `${Math.min(width * 1.2, 120)}px`,
              height: `${Math.min(height * 1.2, 160)}px`,
            }}
          >
            <span className="text-gray-400 text-xs font-medium">{width}×{height}mm</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSelect(width, height)}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg"
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
  const [activeCategory, setActiveCategory] = useState<'system' | 'user' | 'custom'>('system');

  // 仮のユーザーID
  const userId = 'demo-user';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);

    try {
      // システムテンプレートを取得
      const systemRes = await getSystemTemplates();
      if (systemRes.success && systemRes.data && systemRes.data.length > 0) {
        setTemplates(systemRes.data);
      }

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
      // フォールバックテンプレートを使用
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCreateWithTemplate = () => {
    if (selectedTemplate) {
      router.push(`/editor?template=${selectedTemplate.id}&width=${selectedTemplate.width_mm}&height=${selectedTemplate.height_mm}&type=${selectedTemplate.type}`);
    }
  };

  const handleCreateCustom = (width: number, height: number) => {
    router.push(`/editor?width=${width}&height=${height}&type=custom`);
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
  const typeOrder = ['price_pop', 'a4', 'a4_pop', 'a5', 'a5_pop', 'a6', 'a6_pop', 'custom'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/popmate_icon_blue.png" 
              alt="PopMate" 
              width={36} 
              height={36}
              className="bg-white rounded-lg p-0.5"
            />
            <h1 className="text-lg font-bold text-white">ポップメイト</h1>
          </Link>
          <Link 
            href="/" 
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            ホーム
          </Link>
        </div>
      </header>

      {/* ステータスバー */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${step.active 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  <span className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${step.active ? 'bg-white/20' : 'bg-gray-200'}
                  `}>
                    {step.id}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-200 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">テンプレートを選択</h2>
          <p className="text-gray-600">作成したいポップのテンプレートを選んでください</p>
        </div>

        {/* カテゴリタブ */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('system')}
            className={`
              px-5 py-2.5 rounded-full font-medium text-sm transition-all
              ${activeCategory === 'system'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            既存テンプレート
          </button>
          <button
            onClick={() => setActiveCategory('user')}
            className={`
              px-5 py-2.5 rounded-full font-medium text-sm transition-all
              ${activeCategory === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            オリジナルデータ
            {userTemplates.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                {userTemplates.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveCategory('custom')}
            className={`
              px-5 py-2.5 rounded-full font-medium text-sm transition-all
              ${activeCategory === 'custom'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            新規作成
          </button>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-500 text-sm">読み込み中...</span>
            </div>
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
                <div key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{info.icon}</span>
                    <h3 className="font-bold text-gray-800">{info.label}</h3>
                    <span className="text-sm text-gray-500">- {info.description}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                </div>
              );
            })}
          </div>
        )}

        {/* ユーザーテンプレート */}
        {!loading && activeCategory === 'user' && (
          <div>
            {userTemplates.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">オリジナルデータがありません</h3>
                <p className="text-gray-500 mb-6">
                  カスタムサイズで作成したテンプレートがここに表示されます
                </p>
                <button
                  onClick={() => setActiveCategory('custom')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md"
                >
                  新規作成する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          <div className="max-w-md mx-auto">
            <CustomSizeCreator onSelect={handleCreateCustom} />
          </div>
        )}
      </main>

      {/* 選択時のフッターバー */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${templateTypeInfo[selectedTemplate.type]?.color || 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center shadow-md`}>
                <span className="text-xl">{templateTypeInfo[selectedTemplate.type]?.icon || '📄'}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{selectedTemplate.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedTemplate.width_mm}×{selectedTemplate.height_mm}mm
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewTemplate(selectedTemplate)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                プレビュー
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateWithTemplate}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 transition-all shadow-md"
              >
                作成する →
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
          onSelect={() => {
            setSelectedTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}
