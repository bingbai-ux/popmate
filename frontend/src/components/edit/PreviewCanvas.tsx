'use client';

import { useMemo } from 'react';
import { EditorElement, TemplateConfig, TaxSettings } from '@/types/editor';
import { Product } from '@/types/product';
import { replaceElementPlaceholders } from '@/lib/placeholderUtils';

interface PreviewCanvasProps {
  template: TemplateConfig;
  elements: EditorElement[];
  product: Product | null;
  taxSettings: TaxSettings;
  zoom?: number;
}

export default function PreviewCanvas({
  template,
  elements,
  product,
  taxSettings,
  zoom = 1,
}: PreviewCanvasProps) {
  const mmToPx = (mm: number) => mm * 3.78 * zoom;

  // プレースホルダーを置換した要素を生成
  const processedElements = useMemo(() => {
    if (!product) return elements;
    return elements.map((el) => replaceElementPlaceholders(el, product, taxSettings));
  }, [elements, product, taxSettings]);

  const renderElement = (element: EditorElement) => {
    const left = mmToPx(element.position.x);
    const top = mmToPx(element.position.y);
    const width = mmToPx(element.size.width);
    const height = mmToPx(element.size.height);

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              left, top, width, height,
              zIndex: element.zIndex,
              fontFamily: element.style.fontFamily,
              fontSize: element.style.fontSize * zoom,
              fontWeight: element.style.fontWeight,
              fontStyle: element.style.fontStyle,
              color: element.style.color,
              opacity: element.style.opacity / 100,
              textAlign: element.style.textAlign,
              letterSpacing: element.style.letterSpacing,
              lineHeight: `${element.style.lineHeight}%`,
              textDecoration: element.style.textDecoration,
              writingMode: element.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
              whiteSpace: element.style.autoWrap ? 'pre-wrap' : 'nowrap',
              overflow: 'hidden',
            }}
          >
            {element.content}
          </div>
        );

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

  return (
    <div className="flex items-center justify-center bg-gray-100 p-6 rounded-lg overflow-auto">
      <div className="relative">
        <div
          className="bg-white shadow-lg relative"
          style={{ width: mmToPx(template.width), height: mmToPx(template.height) }}
        >
          {/* グリッド */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
              backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
            }}
          />
          {processedElements.map(renderElement)}
        </div>

        {/* プレビュー中の商品名 */}
        {product && (
          <div className="text-center mt-3">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-border">
              プレビュー: {product.productName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
