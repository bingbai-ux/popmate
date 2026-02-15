'use client';

import { useRef, useState, useEffect } from 'react';
import { EditorElement, TemplateConfig, TaxSettings } from '@/types/editor';
import { Product } from '@/types/product';
import { replaceAllElementsWithSummarize, replaceElementPlaceholders } from '@/lib/placeholderUtils';
import { applyKinsoku } from '@/lib/textUtils';

interface PreviewCanvasProps {
  template: TemplateConfig;
  elements: EditorElement[];
  product: Product | null;
  taxSettings: TaxSettings;
  zoom?: number;
  summarizeEnabled?: boolean;
}

/**
 * プレビューキャンバス
 *
 * 方式: 固定倍率(BASE_ZOOM)で内部描画 → CSS transform: scale() で表示サイズに合わせる
 * → テキスト・図形・画像の比率が常にデザイン時と同一になる
 */
export default function PreviewCanvas({
  template,
  elements,
  product,
  taxSettings,
  summarizeEnabled = true,
}: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cssScale, setCssScale] = useState(1);
  const [processedElements, setProcessedElements] = useState<EditorElement[]>(elements);
  const [isProcessing, setIsProcessing] = useState(false);

  // 固定の内部描画倍率（この倍率でレンダリングし、CSSで拡縮する）
  const BASE_ZOOM = 2;
  const mmToPx = (mm: number) => mm * 3.78 * BASE_ZOOM;

  // ポップの実ピクセルサイズ（BASE_ZOOM倍率）
  const popWidthPx = mmToPx(template.width);
  const popHeightPx = mmToPx(template.height);

  // 親コンテナに合わせてCSS scaleを自動計算
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { clientWidth: cw, clientHeight: ch } = container;
      const availableW = cw - 32;
      const availableH = ch - 32;
      if (availableW <= 0 || availableH <= 0) return;

      const scaleX = availableW / popWidthPx;
      const scaleY = availableH / popHeightPx;
      setCssScale(Math.min(scaleX, scaleY, 2));
    };

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [popWidthPx, popHeightPx]);

  // プレースホルダーを置換（summarizeEnabled に応じてAI省略の有無を切替）
  useEffect(() => {
    if (!product) {
      setProcessedElements(elements);
      return;
    }

    if (!summarizeEnabled) {
      // AI要約OFF → 同期的にプレースホルダーのみ置換
      const replaced = elements.map(el => replaceElementPlaceholders(el, product, taxSettings));
      setProcessedElements(replaced);
      setIsProcessing(false);
      return;
    }

    let isCancelled = false;
    setIsProcessing(true);

    replaceAllElementsWithSummarize(elements, product, taxSettings)
      .then((result) => {
        if (!isCancelled) {
          setProcessedElements(result);
          setIsProcessing(false);
        }
      })
      .catch((error) => {
        console.error('Failed to process elements:', error);
        if (!isCancelled) {
          setProcessedElements(elements);
          setIsProcessing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [elements, product, taxSettings, summarizeEnabled]);

  const renderElement = (element: EditorElement) => {
    const left = mmToPx(element.position.x);
    const top = mmToPx(element.position.y);
    const width = mmToPx(element.size.width);
    const height = mmToPx(element.size.height);

    switch (element.type) {
      case 'text': {
        // 禁則処理を適用
        const processedContent = applyKinsoku(element.content);

        // 垂直配置（エディタと同じflexbox方式）
        const verticalAlign = element.style.verticalAlign || 'top';
        const justifyContent = verticalAlign === 'top' ? 'flex-start'
          : verticalAlign === 'bottom' ? 'flex-end'
          : 'center';

        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left, top, width, height,
              zIndex: element.zIndex,
              display: 'flex',
              flexDirection: 'column',
              justifyContent,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontFamily: element.style.fontFamily,
                fontSize: element.style.fontSize * BASE_ZOOM,
                fontWeight: element.style.fontWeight,
                fontStyle: element.style.fontStyle,
                color: element.style.color,
                opacity: element.style.opacity / 100,
                textAlign: element.style.textAlign,
                letterSpacing: element.style.letterSpacing * BASE_ZOOM,
                lineHeight: `${element.style.lineHeight}%`,
                textDecoration: element.style.textDecoration,
                writingMode: element.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
                whiteSpace: element.style.autoWrap ? 'pre-wrap' : 'nowrap',
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
                overflow: 'hidden',
                // 文字幅（エディタと同じscaleX）
                transform: element.style.textWidth !== 100 ? `scaleX(${element.style.textWidth / 100})` : undefined,
                transformOrigin: 'left top',
              }}
            >
              {processedContent}
            </div>
          </div>
        );
      }

      case 'shape':
        return (
          <div key={element.id} style={{ position: 'absolute', left, top, width, height, zIndex: element.zIndex }}>
            <svg width="100%" height="100%" className="overflow-visible">
              {element.shapeType === 'rectangle' && (
                <rect width={width} height={height} fill={element.style.fill} fillOpacity={element.style.fillOpacity / 100} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />
              )}
              {element.shapeType === 'roundedRect' && (
                <rect width={width} height={height} rx={element.style.cornerRadius || 5} fill={element.style.fill} fillOpacity={element.style.fillOpacity / 100} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />
              )}
              {element.shapeType === 'circle' && (
                <ellipse cx={width/2} cy={height/2} rx={width/2} ry={height/2} fill={element.style.fill} fillOpacity={element.style.fillOpacity / 100} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />
              )}
              {element.shapeType === 'triangle' && (
                <polygon points={`${width/2},0 ${width},${height} 0,${height}`} fill={element.style.fill} fillOpacity={element.style.fillOpacity / 100} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />
              )}
              {element.shapeType === 'star' && (() => {
                const pts = [];
                for (let i = 0; i < 10; i++) {
                  const r = i % 2 === 0 ? Math.min(width, height) / 2 : Math.min(width, height) / 4;
                  const angle = (i * Math.PI) / 5 - Math.PI / 2;
                  pts.push(`${width/2 + r * Math.cos(angle)},${height/2 + r * Math.sin(angle)}`);
                }
                return <polygon points={pts.join(' ')} fill={element.style.fill} fillOpacity={element.style.fillOpacity / 100} stroke={element.style.stroke} strokeWidth={element.style.strokeWidth} />;
              })()}
            </svg>
          </div>
        );

      case 'image':
        return (
          <img
            key={element.id}
            src={element.src}
            alt={element.alt}
            style={{ position: 'absolute', left, top, width, height, zIndex: element.zIndex, objectFit: 'contain', opacity: element.opacity / 100 }}
          />
        );

      default:
        return null;
    }
  };

  // transform後の見た目サイズ
  const displayW = popWidthPx * cssScale;
  const displayH = popHeightPx * cssScale;

  return (
    <div ref={containerRef} className="flex items-center justify-center bg-gray-100 p-4 rounded-lg h-full overflow-hidden">
      <div className="flex flex-col items-center">
        {/* ポップ本体: 固定サイズで描画 → CSS scaleで表示調整 */}
        <div
          style={{
            width: displayW,
            height: displayH,
          }}
        >
          <div
            className="bg-white shadow-lg relative origin-top-left"
            style={{
              width: popWidthPx,
              height: popHeightPx,
              transform: `scale(${cssScale})`,
            }}
          >
            {/* グリッド */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
                backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
              }}
            />
            {/* 処理中インジケーター */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI処理中...</span>
                </div>
              </div>
            )}
            {processedElements.map(renderElement)}
          </div>
        </div>
      </div>
    </div>
  );
}
