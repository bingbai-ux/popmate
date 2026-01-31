'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import PreviewCanvas from '@/components/edit/PreviewCanvas';
import { Product } from '@/types/product';
import {
  EditorElement,
  TemplateConfig,
  TaxSettings,
  DEFAULT_TAX_SETTINGS,
} from '@/types/editor';
import { getTemplateById } from '@/types/template';
import { loadSelectedProducts } from '@/lib/selectedProductsStorage';
import { loadEditorState } from '@/lib/editorStorage';

function PrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';
  const printRef = useRef<HTMLDivElement>(null);

  // テンプレート設定
  const templateData = getTemplateById(templateId);
  const template: TemplateConfig = templateData
    ? { id: templateData.id, name: templateData.name, width: templateData.width, height: templateData.height }
    : { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 };

  // 状態
  const [products, setProducts] = useState<Product[]>([]);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentProduct = products[currentIndex] || null;

  // 初期データ読み込み
  useEffect(() => {
    // selectedProductsStorageから商品データを取得（正しいキーを使用）
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
      console.log('[print] 選択商品を読み込みました:', savedProducts.length, '件');
    } else {
      console.log('[print] 選択商品が見つかりません');
    }

    // editorStorageからテンプレート要素を取得
    const savedEditorState = loadEditorState(templateId);
    if (savedEditorState && savedEditorState.elements.length > 0) {
      setElements(savedEditorState.elements as unknown as EditorElement[]);
      console.log('[print] エディター状態を読み込みました:', savedEditorState.elements.length, '要素');
    }

    // sessionStorageから税設定を取得
    try {
      const savedTaxSettings = sessionStorage.getItem('taxSettings');
      if (savedTaxSettings) {
        setTaxSettings(JSON.parse(savedTaxSettings));
      }
    } catch (e) {
      console.error('[print] 税設定の復元に失敗:', e);
    }

    setIsLoaded(true);
  }, [templateId]);

  // 印刷実行
  const handlePrint = () => {
    window.print();
  };

  // PDFダウンロード（html2canvasとjsPDFを使用）
  const handleDownloadPDF = async () => {
    try {
      // 動的インポート
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: template.width > template.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [template.width, template.height],
      });

      for (let i = 0; i < products.length; i++) {
        setCurrentIndex(i);
        await new Promise(resolve => setTimeout(resolve, 100)); // レンダリング待ち

        const element = printRef.current;
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage([template.width, template.height]);
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, template.width, template.height);
      }

      pdf.save(`popmate_${templateId}_${products.length}items.pdf`);
      setCurrentIndex(0);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    }
  };

  // 前の商品
  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  // 次の商品
  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(products.length - 1, prev + 1));
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <p className="text-gray-500 mb-4">印刷するデータがありません</p>
          <button
            onClick={() => router.push(`/data-select?template=${templateId}`)}
            className="btn-primary text-sm py-2 px-4"
          >
            商品を選択する
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* サブヘッダー */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/edit?template=${templateId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">編集に戻る</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h2 className="font-medium text-sm">印刷</h2>
            <p className="text-xs text-gray-500">
              {template.name}（{template.width} × {template.height} mm）・{products.length}件の商品ポップ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDFダウンロード
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary text-sm py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            印刷する
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 print:p-0">
        {/* 商品ナビゲーション */}
        {products.length > 1 && (
          <div className="flex items-center gap-4 mb-6 print:hidden">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm text-gray-600">
              <span className="font-bold text-primary">{currentIndex + 1}</span>
              <span className="mx-1">/</span>
              <span>{products.length}</span>
              <span className="ml-2 text-gray-400">件</span>
            </div>
            <button
              onClick={handleNext}
              disabled={currentIndex === products.length - 1}
              className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* プレビュー */}
        <div ref={printRef} className="print:m-0">
          <PreviewCanvas
            template={template}
            elements={elements}
            product={currentProduct}
            taxSettings={taxSettings}
            zoom={2}
          />
        </div>

        {/* 商品情報 */}
        {currentProduct && (
          <div className="mt-6 text-center print:hidden">
            <p className="text-sm font-medium text-gray-700">{currentProduct.productName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {currentProduct.categoryName && `${currentProduct.categoryName} / `}
              {currentProduct.maker || currentProduct.groupCode}
            </p>
          </div>
        )}
      </div>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            margin: 0;
            size: ${template.width}mm ${template.height}mm;
          }
        }
      `}</style>
    </>
  );
}

export default function PrintPage() {
  return (
    <main className="min-h-screen bg-background-light flex flex-col print:bg-white">
      <div className="print:hidden">
        <Header />
        <ProgressBar currentStep={5} />
      </div>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">読み込み中...</div>}>
        <PrintContent />
      </Suspense>
    </main>
  );
}
