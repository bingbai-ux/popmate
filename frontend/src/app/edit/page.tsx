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
import { loadSelectedProducts, saveSelectedProducts, loadCsvFieldData, saveCsvFieldData, saveProcessedElements } from '@/lib/selectedProductsStorage';
import { loadEditorState } from '@/lib/editorStorage';
import { FieldToggleState, CsvFieldMap, applyCsvOverrides } from '@/types/csvFieldToggle';
import { replaceAllElementsWithSummarize, replaceElementPlaceholders } from '@/lib/placeholderUtils';

function EditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // テンプレート設定（editorStorageのカスタムサイズを優先）
  const templateData = getTemplateById(templateId);
  const baseTemplate: TemplateConfig = templateData
    ? { id: templateData.id, name: templateData.name, width: templateData.width, height: templateData.height }
    : { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 };
  const [template, setTemplate] = useState<TemplateConfig>(baseTemplate);

  // 状態
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettingsType>(DEFAULT_TAX_SETTINGS);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [summarizeFlags, setSummarizeFlags] = useState<boolean[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState({ current: 0, total: 0 });

  // ─── CSVフィールド切り替え ───
  const [fieldToggleState, setFieldToggleState] = useState<FieldToggleState>({});
  const [csvFieldMap, setCsvFieldMap] = useState<CsvFieldMap>({});

  // CSVトグル変更時に自動保存
  useEffect(() => {
    if (Object.keys(csvFieldMap).length > 0) {
      saveCsvFieldData(csvFieldMap, fieldToggleState, templateId);
    }
  }, [fieldToggleState, csvFieldMap, templateId]);

  const rawSelectedProduct = products[currentProductIndex] || null;
  const selectedProduct = rawSelectedProduct
    ? applyCsvOverrides(rawSelectedProduct, csvFieldMap, fieldToggleState)
    : null;
  const selectedSummarizeEnabled = summarizeFlags[currentProductIndex] ?? true;

  // 初期データ読み込み
  useEffect(() => {
    // selectedProductsStorageから商品データを取得
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
      setCurrentProductIndex(0);
      // AI要約フラグを復元（デフォルト: 全てON）
      try {
        const savedFlags = sessionStorage.getItem('summarizeFlags');
        if (savedFlags) {
          const parsed = JSON.parse(savedFlags) as boolean[];
          // 商品数に合わせてリサイズ
          setSummarizeFlags(savedProducts.map((_, i) => parsed[i] ?? true));
        } else {
          setSummarizeFlags(savedProducts.map(() => true));
        }
      } catch {
        setSummarizeFlags(savedProducts.map(() => true));
      }
      console.log('[edit] 選択商品を読み込みました:', savedProducts.length, '件');
    } else {
      console.log('[edit] 選択商品が見つかりません');
    }

    // CSVフィールドデータを復元
    const savedCsvData = loadCsvFieldData(templateId);
    if (savedCsvData) {
      setCsvFieldMap(savedCsvData.csvFieldMap);
      setFieldToggleState(savedCsvData.fieldToggleState);
      console.log('[edit] CSVフィールドデータを復元しました');
    }

    // editorStorageからテンプレート要素を取得
    const savedEditorState = loadEditorState(templateId);
    if (savedEditorState && savedEditorState.elements.length > 0) {
      setElements(savedEditorState.elements as unknown as EditorElement[]);
      // カスタムサイズを復元
      if (savedEditorState.templateWidth && savedEditorState.templateHeight) {
        setTemplate(prev => ({
          ...prev,
          width: savedEditorState.templateWidth!,
          height: savedEditorState.templateHeight!,
        }));
      }
      console.log('[edit] エディター状態を読み込みました:', savedEditorState.elements.length, '要素');
    } else {
      // フォールバック: currentProject（保存プロジェクト）から要素を復元
      let restoredFromProject = false;
      try {
        const currentProjectJson = sessionStorage.getItem('currentProject');
        if (currentProjectJson) {
          const currentProject = JSON.parse(currentProjectJson);
          if (currentProject.elements && currentProject.elements.length > 0) {
            setElements(currentProject.elements as EditorElement[]);
            if (currentProject.template?.width && currentProject.template?.height) {
              setTemplate(prev => ({
                ...prev,
                width: currentProject.template.width,
                height: currentProject.template.height,
              }));
            }
            console.log('[edit] currentProjectから要素を復元しました:', currentProject.elements.length, '要素');
            restoredFromProject = true;
          }
        }
      } catch (e) {
        console.error('[edit] currentProjectの復元に失敗:', e);
      }

      if (!restoredFromProject) {
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

  // AI要約トグル（個別）
  const handleToggleSummarize = useCallback((index: number) => {
    setSummarizeFlags(prev => prev.map((v, i) => i === index ? !v : v));
  }, []);

  // AI要約トグル（全選択/全解除）
  const handleToggleAllSummarize = useCallback((enabled: boolean) => {
    setSummarizeFlags(prev => prev.map(() => enabled));
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
            onClick={async () => {
              // 印刷前にデータを保存
              saveSelectedProducts(products, templateId);
              saveCsvFieldData(csvFieldMap, fieldToggleState, templateId);
              sessionStorage.setItem('taxSettings', JSON.stringify(taxSettings));
              sessionStorage.setItem('summarizeFlags', JSON.stringify(summarizeFlags));

              // 全商品のAI処理を一括実行してsessionStorageに保存
              setIsPreparing(true);
              setPrepareProgress({ current: 0, total: products.length });
              try {
                const processedMap = new Map<string, EditorElement[]>();
                for (let i = 0; i < products.length; i++) {
                  const product = applyCsvOverrides(products[i], csvFieldMap, fieldToggleState);
                  const key = product.productId || product.productCode || product.productName;
                  const shouldSummarize = summarizeFlags[i] ?? true;

                  if (shouldSummarize) {
                    try {
                      const processed = await replaceAllElementsWithSummarize(elements, product, taxSettings);
                      processedMap.set(key, processed);
                    } catch {
                      const fallback = elements.map(el => replaceElementPlaceholders(el, product, taxSettings));
                      processedMap.set(key, fallback);
                    }
                  } else {
                    const replaced = elements.map(el => replaceElementPlaceholders(el, product, taxSettings));
                    processedMap.set(key, replaced);
                  }
                  setPrepareProgress({ current: i + 1, total: products.length });
                }
                saveProcessedElements(processedMap);
              } catch (error) {
                console.error('[edit] 印刷データ準備エラー:', error);
              } finally {
                setIsPreparing(false);
              }

              router.push(`/print?template=${templateId}`);
            }}
            disabled={products.length === 0 || isPreparing}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            {isPreparing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                テキスト最適化中... ({prepareProgress.current}/{prepareProgress.total})
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                印刷へ進む ({products.length}件)
              </>
            )}
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
            <div className="h-full flex flex-col p-4 bg-white/50">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <h3 className="font-bold text-sm text-text-dark">プレビュー</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>←→ 商品テーブルの行をクリックで切替</span>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <PreviewCanvas
                  template={template}
                  elements={elements}
                  product={selectedProduct}
                  taxSettings={taxSettings}
                  summarizeEnabled={selectedSummarizeEnabled}
                />
              </div>
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
                summarizeFlags={summarizeFlags}
                onToggleSummarize={handleToggleSummarize}
                onToggleAllSummarize={handleToggleAllSummarize}
                fieldToggleState={fieldToggleState}
                onFieldToggleChange={setFieldToggleState}
                csvFieldMap={csvFieldMap}
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
