'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import PreviewCanvas from '@/components/edit/PreviewCanvas';
import TaxSettings from '@/components/edit/TaxSettings';
import ProductEditTable from '@/components/edit/ProductEditTable';
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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettingsType>(DEFAULT_TAX_SETTINGS);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedProduct = products.find((p) => p.productId === selectedProductId) || null;

  // 初期データ読み込み
  useEffect(() => {
    // sessionStorageから商品データを取得
    const savedProducts = sessionStorage.getItem('selectedProducts');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        setProducts(parsed);
        if (parsed.length > 0) {
          setSelectedProductId(parsed[0].productId);
        }
      } catch (e) {
        console.error('Failed to parse selectedProducts', e);
      }
    }

    // sessionStorageからテンプレート要素を取得
    const savedElements = sessionStorage.getItem('templateElements');
    if (savedElements) {
      try {
        setElements(JSON.parse(savedElements));
      } catch (e) {
        console.error('Failed to parse templateElements', e);
      }
    }

    // デフォルト要素がない場合
    if (!savedElements) {
      setElements([
        {
          id: 'default-name',
          type: 'text',
          position: { x: 5, y: 5 },
          size: { width: 80, height: 10 },
          rotation: 0,
          zIndex: 1,
          content: '{{productName}}',
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

    setIsLoaded(true);
  }, []);

  // 商品選択
  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId);
  }, []);

  // 商品更新
  const handleUpdateProduct = useCallback((productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, ...updates } : p))
    );
  }, []);

  // 保存
  const handleSave = () => {
    sessionStorage.setItem('selectedProducts', JSON.stringify(products));
    sessionStorage.setItem('templateElements', JSON.stringify(elements));
    sessionStorage.setItem('taxSettings', JSON.stringify(taxSettings));
    alert('保存しました');
  };

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
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
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
            className="px-3 py-2 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            デザインを編集
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            保存
          </button>
          <button
            onClick={() => setShowPrintPreview(true)}
            disabled={products.length === 0}
            className="btn-primary text-sm py-2 disabled:opacity-50"
          >
            印刷プレビュー ({products.length}件)
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
              className="btn-primary text-sm py-2 px-4"
            >
              商品を選択する
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 上部: プレビュー + 税設定 */}
          <div className="flex gap-6 p-6 border-b border-border bg-white/50">
            {/* プレビュー */}
            <div className="flex-1 min-w-0">
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

            {/* 税設定 */}
            <div className="w-64 flex-shrink-0">
              <TaxSettings
                settings={taxSettings}
                onChange={setTaxSettings}
              />
            </div>
          </div>

          {/* 下部: 商品テーブル */}
          <div className="flex-1 p-6 overflow-auto">
            <ProductEditTable
              products={products}
              selectedProductId={selectedProductId}
              taxSettings={taxSettings}
              onSelectProduct={handleSelectProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          </div>
        </div>
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
