'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import PreviewCanvas from '@/components/edit/PreviewCanvas';
import { ProductDataTable } from '@/components/edit/ProductDataTable';
import { ResizableSplit } from '@/components/ui/ResizableSplit';
import PrintPreviewModal from '@/components/edit/PrintPreviewModal';
import { Product } from '@/types/product';
import {
  EditorElement,
  TemplateConfig,
  TaxSettings as TaxSettingsType,
  DEFAULT_TAX_SETTINGS,
  DEFAULT_TEXT_STYLE,
} from '@/types/editor';
import { getTemplateById } from '@/types/template';
import { loadSelectedProducts, saveSelectedProducts } from '@/lib/selectedProductsStorage';
import { loadEditorState } from '@/lib/editorStorage';

function EditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // テンプレート設定
  const templateData = getTemplateById(templateId);
  const template: TemplateConfig = templateData
    ? { id: templateData.id, name: templateData.name, width: templateData.width, height: templateData.height }
    : { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 };

  // 状態
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettingsType>(DEFAULT_TAX_SETTINGS);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedProduct = products[currentProductIndex] || null;

  // 初期データ読み込み
  useEffect(() => {
    // selectedProductsStorageから商品データを取得
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
      setCurrentProductIndex(0);
      console.log('[edit] 選択商品を読み込みました:', savedProducts.length, '件');
    } else {
      console.log('[edit] 選択商品が見つかりません');
    }

    // editorStorageからテンプレート要素を取得
    const savedEditorState = loadEditorState(templateId);
    if (savedEditorState && savedEditorState.elements.length > 0) {
      setElements(savedEditorState.elements as unknown as EditorElement[]);
      console.log('[edit] エディター状態を読み込みました:', savedEditorState.elements.length, '要素');
    } else {
      // デフォルト要素を設定
      setElements([
        {
          id: 'default-name',
          type: 'text',
          position: { x: 5, y: 5 },
          size: { width: 80, height: 10 },
          rotation: 0,
          zIndex: 1,
          content: 'テキスト{{productName}}',
          style: { ...DEFAULT_TEXT_STYLE, fontSize: 16, fontWeight: 'bold' },
        },
        {
          id: 'default-price',
          type: 'text',
          position: { x: 5, y: 25 },
          size: { width: 80, height: 20 },
          rotation: 0,
          zIndex: 2,
          content: '{{taxIncludedPrice}}',
          style: { ...DEFAULT_TEXT_STYLE, fontSize: 32, fontWeight: 'bold', color: '#DC2626' },
        },
        {
          id: 'default-desc',
          type: 'text',
          position: { x: 5, y: 45 },
          size: { width: 80, height: 8 },
          rotation: 0,
          zIndex: 3,
          content: '{{description}}',
          style: { ...DEFAULT_TEXT_STYLE, fontSize: 10, color: '#6B7280' },
        },
      ]);
    }

    // 税設定を復元
    try {
      const savedTaxSettings = sessionStorage.getItem('taxSettings');
      if (savedTaxSettings) {
        setTaxSettings(JSON.parse(savedTaxSettings));
      }
    } catch (e) {
      console.error('[edit] 税設定の復元に失敗:', e);
    }

    setIsLoaded(true);
  }, [templateId]);

  // 商品選択（インデックスベース）
  const handleSelectProduct = useCallback((index: number) => {
    setCurrentProductIndex(index);
  }, []);

  // 商品更新（インデックスベース）
  const handleEditProduct = useCallback((index: number, field: string, value: string) => {
    setProducts(prev => prev.map((p, i) =>
      i === index
        ? { ...p, [field]: field === 'price' ? Number(value) || p.price : value }
        : p
    ));
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* サブヘッダー */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/data-select?template=${templateId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">戻る</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h2 className="font-medium text-sm">編集画面</h2>
            <p className="text-xs text-gray-500">
              {template.name}（{template.width} × {template.height} mm）・{products.length}件の商品
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/editor?template=${templateId}`)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            デザインを編集
          </button>
          {/* ★ 「保存」ボタン削除 — 保存は印刷画面で行う */}
          {/* ★ 「印刷へ進む」を青ボタンに変更 */}
          <button
            onClick={() => {
              // 印刷前にデータを保存
              saveSelectedProducts(products, templateId);
              sessionStorage.setItem('taxSettings', JSON.stringify(taxSettings));
              router.push(`/print?template=${templateId}`);
            }}
            disabled={products.length === 0}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷へ進む ({products.length}件)
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      {products.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 mb-4">商品が選択されていません</p>
            <Link
              href={`/data-select?template=${templateId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              商品を選択する
            </Link>
          </div>
        </div>
      ) : (
        <ResizableSplit
          className="flex-1 overflow-hidden"
          direction="vertical"
          initialSize={350}
          minSize={200}
          maxSize={600}
          topContent={
            <div className="h-full p-6 bg-white/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-text-dark">プレビュー</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>←→ 商品テーブルの行をクリックで切替</span>
                </div>
              </div>
              <PreviewCanvas
                template={template}
                elements={elements}
                product={selectedProduct}
                taxSettings={taxSettings}
                zoom={1.5}
              />
            </div>
          }
          bottomContent={
            <div className="h-full p-6 overflow-auto">
              <ProductDataTable
                products={products}
                elements={elements}
                currentIndex={currentProductIndex}
                onSelectProduct={handleSelectProduct}
                roundingMethod={taxSettings.roundingMode}
                onEditProduct={handleEditProduct}
              />
            </div>
          }
        />
      )}

      {/* 印刷プレビューモーダル */}
      {showPrintPreview && (
        <PrintPreviewModal
          template={template}
          elements={elements}
          products={products}
          taxSettings={taxSettings}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </>
  );
}

export default function EditPage() {
  return (
    <main className="min-h-screen bg-background-light flex flex-col">
      <Header />
      <ProgressBar currentStep={4} />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">読み込み中...</div>}>
        <EditContent />
      </Suspense>
    </main>
  );
}
