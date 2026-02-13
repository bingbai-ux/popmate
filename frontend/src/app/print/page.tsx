'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import { SaveModal } from '@/components/SaveModal';
import { saveProject, generateProjectId, findProjectByName } from '@/lib/projectStorage';
import { SaveType } from '@/types/project';
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
import { applyKinsoku } from '@/lib/textUtils';

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
  const [displayPage, setDisplayPage] = useState(0); // 画面表示中のページ（0始まり）
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  // 印刷設定
  const [paperSize, setPaperSize] = useState<string>('a4');
  const [offsetX, setOffsetX] = useState(0);  // 位置調整 X (mm)
  const [offsetY, setOffsetY] = useState(0);  // 位置調整 Y (mm)
  const [showBorders, setShowBorders] = useState(false); // 枠あり印刷

  // 保存機能
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [currentSaveType, setCurrentSaveType] = useState<SaveType | undefined>(undefined);

  // プレビュースケール
  const [previewScale, setPreviewScale] = useState(0.55);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // --- 状態の復元 ---
  useEffect(() => {
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      setProducts(savedProducts);
      console.log('[print] 選択商品を読み込みました:', savedProducts.length, '件');
    } else {
      console.log('[print] 選択商品が見つかりません');
    }

    const savedEditorState = loadEditorState(templateId);
    if (savedEditorState && savedEditorState.elements.length > 0) {
      setElements(savedEditorState.elements);
      console.log('[print] エディター状態を読み込みました:', savedEditorState.elements.length, '要素');
    }

    try {
      const savedTaxSettings = sessionStorage.getItem('taxSettings');
      if (savedTaxSettings) {
        setTaxSettings(JSON.parse(savedTaxSettings));
      }
    } catch (e) {
      console.error('[print] 税設定の復元に失敗:', e);
    }

    // URLパラメータからプロジェクト情報を復元（保存データ再編集時）
    const pid = searchParams.get('projectId');
    const pname = searchParams.get('projectName');
    if (pid) setCurrentProjectId(pid);
    if (pname) setCurrentProjectName(decodeURIComponent(pname));

    setIsLoaded(true);
  }, [templateId, searchParams]);

  // --- プレビュースケールの動的計算 ---
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // A4幅(210mm ≈ 793.7px @96dpi) に対するスケール
        const a4WidthPx = 210 * 3.7795; // ≈ 793.7px
        const scale = Math.min((containerWidth - 40) / a4WidthPx, 0.7);
        setPreviewScale(Math.max(scale, 0.35));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // --- レイアウト計算 ---
  const templateSize = TEMPLATE_SIZES[templateId] || { width: template.width, height: template.height, name: template.name };
  const paper: PaperSize = PAPER_SIZES[paperSize];

  const layout: LayoutResult = useMemo(() => {
    return calculateLayout(templateSize, paper, products.length, {
      gapX: 0,
      gapY: 0,
    });
  }, [templateSize, paper, products.length]);

  // --- ページナビゲーション ---
  const handlePrevPage = () => setDisplayPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setDisplayPage(p => Math.min(layout.totalPages - 1, p + 1));

  // --- 印刷 ---
  const handlePrint = () => {
    window.print();
  };

  // --- PDF生成 ---
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const { exportA4PDF } = await import('@/lib/pdfExport');
      await exportA4PDF({
        filename: `popmate-${templateId}-${new Date().toISOString().slice(0, 10)}.pdf`,
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

  // --- 同名プロジェクト検索（SaveModalから呼ばれる） ---
  const handleFindDuplicate = async (name: string, saveType: SaveType) => {
    const existing = await findProjectByName(name, saveType, currentProjectId || undefined);
    if (existing) {
      return { id: existing.id, name: existing.name };
    }
    return null;
  };

  // --- 保存処理 ---
  const handleSave = async (name: string, saveType: SaveType, overwriteId?: string) => {
    console.log('[save] ★ handleSave called:', { name, saveType, overwriteId });
    setIsSaving(true);
    try {
      // 上書き先IDがあればそれを使い、なければ現在のプロジェクトID or 新規ID
      const projectId = overwriteId || currentProjectId || generateProjectId();

      // サムネイル生成
      let thumbnail: string | undefined;
      try {
        const firstPage = document.querySelector<HTMLElement>('.a4-page');
        if (firstPage) {
          const { default: html2canvas } = await import('html2canvas');
          const canvas = await html2canvas(firstPage, {
            scale: 0.3,
            useCORS: true,
            backgroundColor: '#ffffff',
          });
          thumbnail = canvas.toDataURL('image/jpeg', 0.6);
        }
      } catch (e) {
        console.warn('[save] サムネイル生成スキップ:', e);
      }

      await saveProject({
        id: projectId,
        name,
        saveType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail,
        template: { id: templateId, name: template.name, width: template.width, height: template.height },
        elements,
        selectedProducts: products,
        roundingMethod: taxSettings.roundingMode,
      });

      setCurrentProjectId(projectId);
      setCurrentProjectName(name);
      setCurrentSaveType(saveType);
      setShowSaveModal(false);

      const typeLabel = saveType === 'template' ? 'テンプレート' : 'プロジェクト';
      const actionLabel = overwriteId ? '上書き保存' : '保存';
      alert(`${typeLabel}として${actionLabel}しました！`);

    } catch (error) {
      console.error('[save] エラー:', error);
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ==================================================
  // ポップ内コンテンツのレンダリング（mm単位）
  // ==================================================
  const renderPopContent = (product: Product) => {
    return elements.map((element) => {
      const processedElement = replaceElementPlaceholders(element, product, taxSettings);
      
      // mm単位で配置
      const left = `${processedElement.position.x}mm`;
      const top = `${processedElement.position.y}mm`;
      const width = `${processedElement.size.width}mm`;
      const height = `${processedElement.size.height}mm`;

      if (processedElement.type === 'text') {
        // 禁則処理を適用（数字+単位、カタカナ連続語の途切れ防止）
        const processedContent = applyKinsoku(processedElement.content);

        // 垂直配置（エディタと同じflexbox方式）
        const verticalAlign = processedElement.style.verticalAlign || 'top';
        const justifyContent = verticalAlign === 'top' ? 'flex-start'
          : verticalAlign === 'bottom' ? 'flex-end'
          : 'center';

        return (
          <div
            key={processedElement.id}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              display: 'flex',
              flexDirection: 'column',
              justifyContent,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: `${processedElement.style.fontSize}px`,
                fontWeight: processedElement.style.fontWeight,
                fontFamily: processedElement.style.fontFamily,
                color: processedElement.style.color,
                textAlign: processedElement.style.textAlign,
                lineHeight: `${processedElement.style.lineHeight}%`,
                letterSpacing: `${processedElement.style.letterSpacing}px`,
                opacity: processedElement.style.opacity / 100,
                whiteSpace: processedElement.style.autoWrap ? 'pre-wrap' : 'nowrap',
                writingMode: processedElement.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                overflow: 'hidden',
                // 文字幅（エディタと同じscaleX）
                transform: processedElement.style.textWidth !== 100 ? `scaleX(${processedElement.style.textWidth / 100})` : undefined,
                transformOrigin: 'left top',
              }}
            >
              {processedContent}
            </div>
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
              zIndex: processedElement.zIndex,
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
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
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
    <div className="min-h-screen bg-gray-100 print-root">

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4">

          {/* === 左側: A4プレビュー === */}
          <div className="flex-1" ref={previewContainerRef}>

            {/* A4ページ群 — このdiv全体が画面・印刷で共用 */}
            <div
              id="print-pages"
              className="overflow-auto"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {/* ★ 全ページをレンダリング（現在ページ以外は visibility: hidden） */}
              {Array.from({ length: layout.totalPages }, (_, pageIndex) => {
                const startIdx = pageIndex * layout.itemsPerPage;
                const pageProducts = products.slice(
                  startIdx,
                  Math.min(startIdx + layout.itemsPerPage, products.length)
                );
                const isCurrentPage = pageIndex === displayPage;

                return (
                  <div
                    key={`page-${pageIndex}`}
                    className={`a4-page ${!isCurrentPage ? 'hidden-page' : ''}`}
                    data-page-index={pageIndex}
                    style={isCurrentPage ? {
                      /* 画面表示: 縮小 */
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                      marginBottom: `calc(-297mm * (1 - ${previewScale}) + 20px)`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      margin: '0 auto',
                    } : {
                      /* 非表示ページ: transform は設定するが visibility: hidden で隠す */
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    {/* グリッドセル */}
                    {Array.from({ length: layout.rows }, (_, row) =>
                      Array.from({ length: layout.columns }, (_, col) => {
                        const itemIdx = row * layout.columns + col;
                        const product = pageProducts[itemIdx];

                        return (
                          <div
                            key={`cell-${row}-${col}`}
                            className="pop-cell"
                            style={{
                              position: 'absolute',
                              left: `${layout.marginX + col * (templateSize.width + layout.gapX) + offsetX}mm`,
                              top: `${layout.marginY + row * (templateSize.height + layout.gapY) + offsetY}mm`,
                              width: `${templateSize.width}mm`,
                              height: `${templateSize.height}mm`,
                            }}
                          >
                            {product ? (
                              <div className={`pop-frame ${showBorders ? 'pop-border' : ''}`} style={{
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                              }}>
                                {renderPopContent(product)}
                              </div>
                            ) : (
                              <div className="empty-frame">
                                <span>空白</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>

            {/* ページナビゲーション */}
            <div className="no-print">
              {layout.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={displayPage <= 0}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-lg font-bold">
                    {displayPage + 1} / {layout.totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={displayPage >= layout.totalPages - 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* === 右側: 情報パネル（印刷時は非表示） === */}
          <div className="w-64 flex-shrink-0 space-y-4 no-print">

            {/* アクションボタン */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50 transition-colors"
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

              {/* ★ 保存ボタン */}
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {currentProjectId ? '上書き保存' : 'データを保存'}
              </button>

              {currentProjectName && (
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <span className={`inline-block w-2 h-2 rounded-full ${currentSaveType === 'template' ? 'bg-purple-400' : 'bg-green-400'}`} />
                  <span>{currentSaveType === 'template' ? 'テンプレート' : 'プロジェクト'}: {currentProjectName}</span>
                </div>
              )}
            </div>

            {/* 印刷設定パネル */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                印刷設定
              </h3>

              <div className="space-y-3">
                {/* 枠あり印刷 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBorders}
                    onChange={(e) => setShowBorders(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">枠あり印刷</span>
                </label>

                {showBorders && (
                  <p className="text-xs text-gray-400 ml-6">
                    カット位置の目安として薄いグレー線を印刷します
                  </p>
                )}

                {/* 位置調整 */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">位置調整</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400">上下</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={offsetY}
                          onChange={(e) => setOffsetY(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center"
                          step="0.5"
                        />
                        <span className="text-xs text-gray-400 flex-shrink-0">mm</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">左右</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={offsetX}
                          onChange={(e) => setOffsetX(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center"
                          step="0.5"
                        />
                        <span className="text-xs text-gray-400 flex-shrink-0">mm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 用紙サイズ */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-2">用紙サイズ</p>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                  <dd className="font-bold text-blue-600">{products.length}件</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">印刷ページ数</dt>
                  <dd className="font-bold text-blue-600">{layout.totalPages}ページ</dd>
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

            {/* 戻るボタン */}
            <button
              onClick={() => router.push(`/edit?template=${templateId}`)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              編集に戻る
            </button>
          </div>
        </div>
      </div>

      {/* 保存モーダル */}
      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        defaultName={currentProjectName || `POP_${new Date().toLocaleDateString('ja-JP')}`}
        isOverwrite={!!currentProjectId}
        isSaving={isSaving}
        currentSaveType={currentSaveType}
        productCount={products.length}
        onFindDuplicate={handleFindDuplicate}
      />
    </div>
  );
}

export default function PrintPage() {
  return (
    <main className="min-h-screen bg-background-light flex flex-col">
      <div className="no-print">
        <Header />
        <ProgressBar currentStep={5} />
      </div>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
        <PrintContent />
      </Suspense>
    </main>
  );
}
