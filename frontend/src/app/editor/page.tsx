'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBar from '@/components/common/StatusBar';
import type { WorkflowStep, Template, DesignData, SelectedProduct } from '@/types';
import { getTemplate } from '@/lib/api';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const templateId = searchParams.get('template');
  const savedId = searchParams.get('saved');
  const isNew = searchParams.get('new') === 'true';

  const [currentStep, setCurrentStep] = useState<WorkflowStep>('template');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStep[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [designData, setDesignData] = useState<DesignData>({ elements: [] });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // カスタムサイズ用
  const [customWidth, setCustomWidth] = useState(60);
  const [customHeight, setCustomHeight] = useState(40);

  useEffect(() => {
    loadInitialData();
  }, [templateId, savedId, isNew]);

  const loadInitialData = async () => {
    setLoading(true);

    try {
      if (templateId) {
        // テンプレートから開始
        const res = await getTemplate(templateId);
        if (res.success && res.data) {
          setTemplate(res.data);
          setDesignData(res.data.design_data || { elements: [] });
          setCompletedSteps(['template']);
          setCurrentStep('design');
        }
      } else if (isNew) {
        // 新規作成
        setCurrentStep('template');
      }
    } catch (error) {
      console.error('=== Load Initial Data Error ===', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
    }
  };

  const handleCreateCustom = () => {
    setTemplate({
      id: 'custom',
      name: 'カスタム',
      type: 'custom',
      width_mm: customWidth,
      height_mm: customHeight,
      design_data: { elements: [] },
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setCompletedSteps(['template']);
    setCurrentStep('design');
  };

  const handleNextStep = () => {
    const stepOrder: WorkflowStep[] = ['template', 'design', 'data', 'preview', 'print'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex < stepOrder.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-bold text-gray-800">ポップメイト</span>
          </Link>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              保存
            </button>
            <button className="btn-primary">
              印刷へ進む
            </button>
          </div>
        </div>
      </header>

      {/* ステータスバー */}
      <StatusBar
        currentStep={currentStep}
        onStepClick={handleStepClick}
        completedSteps={completedSteps}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 p-4">
        {/* テンプレート選択（新規作成時） */}
        {currentStep === 'template' && isNew && (
          <div className="max-w-xl mx-auto">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">カスタムサイズを設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    幅 (mm)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    min={10}
                    max={297}
                    step={0.1}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    高さ (mm)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    min={10}
                    max={420}
                    step={0.1}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleCreateCustom}
                  className="btn-primary w-full"
                >
                  このサイズで作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* デザイン編集 */}
        {currentStep === 'design' && template && (
          <div className="flex gap-4 h-[calc(100vh-200px)]">
            {/* ツールパネル */}
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-4">ツール</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2">
                  <span>📝</span> テキスト追加
                </button>
                <button className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2">
                  <span>🖼️</span> 画像追加
                </button>
                <button className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2">
                  <span>📊</span> 表追加
                </button>
                <button className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2">
                  <span>📦</span> 商品フィールド
                </button>
              </div>
              <hr className="my-4" />
              <div className="text-sm text-gray-500">
                <p>サイズ: {template.width_mm}×{template.height_mm}mm</p>
              </div>
            </div>

            {/* キャンバス */}
            <div className="flex-1 bg-gray-200 rounded-lg flex items-center justify-center overflow-auto">
              <div
                className="bg-white shadow-lg"
                style={{
                  width: `${template.width_mm * 3}px`,
                  height: `${template.height_mm * 3}px`,
                  minWidth: '200px',
                  minHeight: '150px',
                }}
              >
                <div className="w-full h-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  デザインエリア
                </div>
              </div>
            </div>

            {/* プロパティパネル */}
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-4">プロパティ</h3>
              <p className="text-sm text-gray-500">
                要素を選択してください
              </p>
            </div>
          </div>
        )}

        {/* データ選択 */}
        {currentStep === 'data' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">商品データを選択</h2>
              <p className="text-gray-500 mb-4">
                スマレジと連携して商品データを取得します
              </p>
              <button className="btn-primary">
                スマレジと連携する
              </button>
            </div>
          </div>
        )}

        {/* プレビュー */}
        {currentStep === 'preview' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">プレビュー</h2>
              <p className="text-gray-500">
                印刷プレビューがここに表示されます
              </p>
            </div>
          </div>
        )}

        {/* 印刷 */}
        {currentStep === 'print' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">印刷設定</h2>
              <p className="text-gray-500 mb-4">
                印刷の設定を行います
              </p>
              <div className="flex gap-4">
                <button className="btn-primary">
                  PDF出力
                </button>
                <button className="btn-secondary">
                  印刷
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 次へボタン */}
        {currentStep !== 'print' && template && (
          <div className="fixed bottom-8 right-8">
            <button onClick={handleNextStep} className="btn-primary">
              次へ進む →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
