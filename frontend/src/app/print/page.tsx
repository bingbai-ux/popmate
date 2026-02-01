'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
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
import {
  calculateLayout,
  TEMPLATE_SIZES,
  PAPER_SIZES,
  type LayoutResult,
  type PaperSize,
} from '@/lib/printLayout';
import { replaceElementPlaceholders } from '@/lib/placeholderUtils';

function PrintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // テンプレート設定
  const templateData = getTemplateById(templateId);
  const template: TemplateConfig = templateData
    ? { id: templateData.id, name: templateData.name, width: templateData.width, height: templateData.height }
    : { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 };

  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  // 印刷設定
  const [paperSize, setPaperSize] = useState<string>('a4');
  const [offsetX, setOffsetX] = useState(0);  // 位置調整 X (mm)
  const [offsetY, setOffsetY] = useState(0);  // 位置調整 Y (mm)

  // Refs
  const printPagesRef = useRef<HTMLDivElement>(null);

  // --- 状態の復元 ---
  useEffect(() => {
    // selectedProductsStorageから商品データを取得
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
      setElements(savedEditorState.elements);
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

  // --- レイアウト計算 ---
  const templateSize = TEMPLATE_SIZES[templateId] || { width: template.width, height: template.height, name: template.name };
  const paper: PaperSize = PAPER_SIZES[paperSize];

  const layout: LayoutResult = useMemo(() => {
    return calculateLayout(templateSize, paper, products.length, {
      gapX: 0,
      gapY: 0,
    });
  }, [templateSize, paper, products.length]);

  // --- mm → px 変換（プレビュー用スケール） ---
  // プレビュー表示のスケール: A4実寸(210mm)を画面幅に合わせる
  const PREVIEW_SCALE = 2.5; // 1mm = 2.5px（A4 210mm → 525px）
  const mmToPx = (mm: number) => mm * PREVIEW_SCALE;

  // --- ページナビゲーション ---
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(layout.totalPages, p + 1));

  // --- 印刷 ---
  const handlePrint = () => {
    window.print();
  };

  // --- PDF生成 ---
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Dynamic import
      const { exportA4LayoutPdf } = await import('@/lib/pdfExport');
      
      await exportA4LayoutPdf({
        filename: `popmate-${templateId}-${new Date().toISOString().slice(0, 10)}.pdf`,
        paper,
        layout,
        onProgress: (current, total) => setPdfProgress({ current, total }),
      });
    } catch (error) {
      console.error('[PDF] 生成エラー:', error);
      alert(`PDF生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  // ==================================================
  // 個別POPのレンダリング（1つのポップ）- プレビュー用
  // ==================================================
  const renderPopPreview = (product: Product, index: number) => {
    return (
      <div
        key={`pop-${product.productId}-${index}`}
        className="pop-frame"
        style={{
          width: mmToPx(templateSize.width),
          height: mmToPx(templateSize.height),
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '0.5px solid #e5e7eb',
          boxSizing: 'border-box',
        }}
      >
        {elements.map((element) => {
          // プレースホルダーを置換
          const processedElement = replaceElementPlaceholders(element, product, taxSettings);
          
          // mm単位の座標をプレビュー用pxに変換
          const left = processedElement.position.x * PREVIEW_SCALE;
          const top = processedElement.position.y * PREVIEW_SCALE;
          const width = processedElement.size.width * PREVIEW_SCALE;
          const height = processedElement.size.height * PREVIEW_SCALE;

          if (processedElement.type === 'text') {
            return (
              <div
                key={processedElement.id}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  fontSize: processedElement.style.fontSize * PREVIEW_SCALE / 3.78,
                  fontWeight: processedElement.style.fontWeight,
                  fontFamily: processedElement.style.fontFamily,
                  color: processedElement.style.color,
                  textAlign: processedElement.style.textAlign,
                  lineHeight: `${processedElement.style.lineHeight}%`,
                  letterSpacing: processedElement.style.letterSpacing,
                  opacity: processedElement.style.opacity / 100,
                  overflow: 'hidden',
                  whiteSpace: processedElement.style.autoWrap ? 'pre-wrap' : 'nowrap',
                  writingMode: processedElement.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                }}
              >
                {processedElement.content}
              </div>
            );
          }

          if (processedElement.type === 'shape') {
            return (
              <div
                key={processedElement.id}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  zIndex: processedElement.zIndex,
                }}
              >
                <svg width="100%" height="100%" className="overflow-visible">
                  {processedElement.shapeType === 'rectangle' && (
                    <rect
                      width={width}
                      height={height}
                      fill={processedElement.style.fill}
                      fillOpacity={processedElement.style.fillOpacity / 100}
                      stroke={processedElement.style.stroke}
                      strokeWidth={processedElement.style.strokeWidth}
                    />
                  )}
                  {processedElement.shapeType === 'roundedRect' && (
                    <rect
                      width={width}
                      height={height}
                      rx={processedElement.style.cornerRadius || 5}
                      fill={processedElement.style.fill}
                      fillOpacity={processedElement.style.fillOpacity / 100}
                      stroke={processedElement.style.stroke}
                      strokeWidth={processedElement.style.strokeWidth}
                    />
                  )}
                  {processedElement.shapeType === 'circle' && (
                    <ellipse
                      cx={width / 2}
                      cy={height / 2}
                      rx={width / 2}
                      ry={height / 2}
                      fill={processedElement.style.fill}
                      fillOpacity={processedElement.style.fillOpacity / 100}
                      stroke={processedElement.style.stroke}
                      strokeWidth={processedElement.style.strokeWidth}
                    />
                  )}
                </svg>
              </div>
            );
          }

          if (processedElement.type === 'image') {
            return (
              <img
                key={processedElement.id}
                src={processedElement.src}
                alt={processedElement.alt}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  objectFit: 'contain',
                  opacity: processedElement.opacity / 100,
                }}
              />
            );
          }

          return null;
        })}
      </div>
    );
  };

  // ==================================================
  // A4ページのレンダリング（1ページ分）- プレビュー用
  // ==================================================
  const renderA4PagePreview = (pageIndex: number) => {
    const startIndex = pageIndex * layout.itemsPerPage;
    const pageProducts = products.slice(
      startIndex,
      Math.min(startIndex + layout.itemsPerPage, products.length)
    );

    // グリッド配置（左上から右方向→下方向）
    const cells = [];
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const itemIndex = row * layout.columns + col;
        const product = pageProducts[itemIndex];
        cells.push(
          <div
            key={`cell-${row}-${col}`}
            style={{
              position: 'absolute',
              left: mmToPx(layout.marginX + col * (templateSize.width + layout.gapX) + offsetX),
              top: mmToPx(layout.marginY + row * (templateSize.height + layout.gapY) + offsetY),
            }}
          >
            {product ? (
              renderPopPreview(product, startIndex + itemIndex)
            ) : (
              // 空白フレーム
              <div
                style={{
                  width: mmToPx(templateSize.width),
                  height: mmToPx(templateSize.height),
                  border: '1px dashed #d1d5db',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>空白</span>
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div
        key={`page-${pageIndex}`}
        className="a4-print-page"
        style={{
          width: mmToPx(paper.width),
          height: mmToPx(paper.height),
          position: 'relative',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          margin: '0 auto',
        }}
      >
        {cells}
      </div>
    );
  };

  // ==================================================
  // 印刷/PDF用の非表示ページレンダリング
  // ==================================================
  const renderHiddenPages = () => {
    return Array.from({ length: layout.totalPages }, (_, pageIndex) => {
      const startIdx = pageIndex * layout.itemsPerPage;
      const pageProducts = products.slice(
        startIdx,
        Math.min(startIdx + layout.itemsPerPage, products.length)
      );

      return (
        <div
          key={`hidden-page-${pageIndex}`}
          className="a4-print-page"
          style={{
            width: `${paper.width}mm`,
            height: `${paper.height}mm`,
            position: 'relative',
            backgroundColor: '#ffffff',
            pageBreakAfter: pageIndex < layout.totalPages - 1 ? 'always' : 'auto',
          }}
        >
          {Array.from({ length: layout.itemsPerPage }, (_, j) => {
            const row = Math.floor(j / layout.columns);
            const col = j % layout.columns;
            const product = pageProducts[j];

            return (
              <div
                key={`hidden-cell-${pageIndex}-${j}`}
                style={{
                  position: 'absolute',
                  left: `${layout.marginX + col * (templateSize.width + layout.gapX) + offsetX}mm`,
                  top: `${layout.marginY + row * (templateSize.height + layout.gapY) + offsetY}mm`,
                  width: `${templateSize.width}mm`,
                  height: `${templateSize.height}mm`,
                }}
              >
                {product && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {elements.map((element) => {
                      const processedElement = replaceElementPlaceholders(element, product, taxSettings);
                      
                      // 印刷用: mm単位で配置
                      const left = `${processedElement.position.x}mm`;
                      const top = `${processedElement.position.y}mm`;
                      const width = `${processedElement.size.width}mm`;
                      const height = `${processedElement.size.height}mm`;

                      if (processedElement.type === 'text') {
                        return (
                          <div
                            key={processedElement.id}
                            style={{
                              position: 'absolute',
                              left,
                              top,
                              width,
                              height,
                              fontSize: `${processedElement.style.fontSize}pt`,
                              fontWeight: processedElement.style.fontWeight,
                              fontFamily: processedElement.style.fontFamily,
                              color: processedElement.style.color,
                              textAlign: processedElement.style.textAlign,
                              lineHeight: `${processedElement.style.lineHeight}%`,
                              letterSpacing: `${processedElement.style.letterSpacing}pt`,
                              opacity: processedElement.style.opacity / 100,
                              overflow: 'hidden',
                              whiteSpace: processedElement.style.autoWrap ? 'pre-wrap' : 'nowrap',
                              writingMode: processedElement.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                            }}
                          >
                            {processedElement.content}
                          </div>
                        );
                      }

                      if (processedElement.type === 'shape') {
                        const widthMm = processedElement.size.width;
                        const heightMm = processedElement.size.height;
                        return (
                          <div
                            key={processedElement.id}
                            style={{
                              position: 'absolute',
                              left,
                              top,
                              width,
                              height,
                            }}
                          >
                            <svg width="100%" height="100%" viewBox={`0 0 ${widthMm} ${heightMm}`} preserveAspectRatio="none">
                              {processedElement.shapeType === 'rectangle' && (
                                <rect
                                  width={widthMm}
                                  height={heightMm}
                                  fill={processedElement.style.fill}
                                  fillOpacity={processedElement.style.fillOpacity / 100}
                                  stroke={processedElement.style.stroke}
                                  strokeWidth={processedElement.style.strokeWidth * 0.264583}
                                />
                              )}
                              {processedElement.shapeType === 'roundedRect' && (
                                <rect
                                  width={widthMm}
                                  height={heightMm}
                                  rx={(processedElement.style.cornerRadius || 5) * 0.264583}
                                  fill={processedElement.style.fill}
                                  fillOpacity={processedElement.style.fillOpacity / 100}
                                  stroke={processedElement.style.stroke}
                                  strokeWidth={processedElement.style.strokeWidth * 0.264583}
                                />
                              )}
                              {processedElement.shapeType === 'circle' && (
                                <ellipse
                                  cx={widthMm / 2}
                                  cy={heightMm / 2}
                                  rx={widthMm / 2}
                                  ry={heightMm / 2}
                                  fill={processedElement.style.fill}
                                  fillOpacity={processedElement.style.fillOpacity / 100}
                                  stroke={processedElement.style.stroke}
                                  strokeWidth={processedElement.style.strokeWidth * 0.264583}
                                />
                              )}
                            </svg>
                          </div>
                        );
                      }

                      if (processedElement.type === 'image') {
                        return (
                          <img
                            key={processedElement.id}
                            src={processedElement.src}
                            alt={processedElement.alt}
                            style={{
                              position: 'absolute',
                              left,
                              top,
                              width,
                              height,
                              objectFit: 'contain',
                              opacity: processedElement.opacity / 100,
                            }}
                          />
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    });
  };

  // ローディング中
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  // 商品がない場合
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

  // ==================================================
  // UIレンダリング
  // ==================================================
  return (
    <>
      {/* ===== 上部: 印刷設定バー ===== */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-sm">
          {/* 戻るボタン */}
          <button
            onClick={() => router.push(`/edit?template=${templateId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>編集に戻る</span>
          </button>

          <div className="h-6 w-px bg-gray-200" />

          {/* 印刷ページ範囲 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">印刷ページ</span>
            <span className="font-bold">{currentPage}</span>
            <span className="text-gray-400">～</span>
            <span className="font-bold">{layout.totalPages}</span>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* 位置調整 */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">位置</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">上に</span>
              <input
                type="number"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                step="0.5"
              />
              <span className="text-xs text-gray-400">mm</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">右に</span>
              <input
                type="number"
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                step="0.5"
              />
              <span className="text-xs text-gray-400">mm</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* 用紙サイズ */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">用紙</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              {Object.entries(PAPER_SIZES).map(([key, size]) => (
                <option key={key} value={key}>
                  {size.name}（{size.width}×{size.height}mm）
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== メインコンテンツ ===== */}
      <div className="flex-1 bg-gray-100 print:bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* ===== 中央: メインエリア (左=プレビュー、右=情報パネル) ===== */}
          <div className="flex gap-4">

            {/* --- 左側: A4プレビュー --- */}
            <div className="flex-1">
              <div
                ref={printPagesRef}
                className="overflow-auto"
                style={{ maxHeight: 'calc(100vh - 240px)' }}
              >
                {renderA4PagePreview(currentPage - 1)}
              </div>

              {/* ページナビゲーション */}
              {layout.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-bold">
                    {currentPage} / {layout.totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= layout.totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* --- 右側: 情報パネル --- */}
            <div className="w-64 flex-shrink-0 space-y-4 print:hidden">

              {/* アクションボタン */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  印刷する
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 font-medium disabled:opacity-50 transition-colors"
                >
                  {isGeneratingPDF ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      PDF生成中... ({pdfProgress.current}/{pdfProgress.total})
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      PDF書き出し
                    </>
                  )}
                </button>
              </div>

              {/* 用紙情報 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                  用紙情報
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">テンプレート</dt>
                    <dd className="font-medium">{template.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">サイズ</dt>
                    <dd className="font-medium">{templateSize.width} × {templateSize.height} mm</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">用紙</dt>
                    <dd className="font-medium">{paper.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">面数</dt>
                    <dd className="font-medium">{layout.itemsPerPage}面</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">余白</dt>
                    <dd className="font-medium">
                      {layout.marginX.toFixed(1)} × {layout.marginY.toFixed(1)} mm
                    </dd>
                  </div>
                </dl>
              </div>

              {/* レイアウト情報 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                  レイアウト情報
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">商品数</dt>
                    <dd className="font-bold text-primary">{products.length}件</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">印刷ページ数</dt>
                    <dd className="font-bold text-primary">{layout.totalPages}ページ</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">空白フレーム数</dt>
                    <dd className="font-medium text-gray-700">{layout.emptyFrames}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">配置</dt>
                    <dd className="font-medium">
                      {layout.columns}列 × {layout.rows}行
                    </dd>
                  </div>
                </dl>
              </div>

              {/* 税込価格設定（読み取り専用） */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                  税込価格設定
                </h3>
                <p className="text-sm text-gray-600">
                  端数処理:
                  <span className="font-medium ml-1">
                    {taxSettings.roundingMode === 'floor' ? '切り捨て' :
                     taxSettings.roundingMode === 'round' ? '四捨五入' : '切り上げ'}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ※ デザイン画面で変更できます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 印刷用の非表示レンダリング領域 ===== */}
      <div
        id="print-pages-hidden"
        className="print-only"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
        }}
      >
        {renderHiddenPages()}
      </div>
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
