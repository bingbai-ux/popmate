'use client';

import { useEffect, useRef } from 'react';
import type { Template, DesignElement } from '@/types';

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onSelect: () => void;
}

// テンプレートタイプのラベル
const templateTypeLabels: Record<string, string> = {
  price_pop: 'プライスポップ',
  a4_pop: 'A4ポップ',
  a5_pop: 'A5ポップ',
  a6_pop: 'A6ポップ',
  custom: 'カスタム',
};

// デザイン要素をレンダリング
function renderElement(element: DesignElement, scale: number) {
  const baseStyle = {
    position: 'absolute' as const,
    left: `${element.x * scale}px`,
    top: `${element.y * scale}px`,
    width: `${element.width * scale}px`,
    height: `${element.height * scale}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
  };

  switch (element.type) {
    case 'text':
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            fontFamily: element.properties.font_family || 'sans-serif',
            fontSize: `${(element.properties.font_size || 12) * scale}px`,
            fontWeight: element.properties.font_weight || 'normal',
            color: element.properties.color || '#000000',
            textAlign: element.properties.text_align || 'left',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {element.properties.text || ''}
        </div>
      );

    case 'image':
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {element.properties.image_url ? (
            <img
              src={element.properties.image_url}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span className="text-gray-400 text-xs">画像</span>
          )}
        </div>
      );

    case 'product_field':
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: '#e8f4fd',
            border: '1px dashed #3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${10 * scale}px`,
            color: '#3b82f6',
          }}
        >
          {element.properties.field_name || '商品フィールド'}
        </div>
      );

    case 'table':
      return (
        <div
          key={element.id}
          style={{
            ...baseStyle,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
          }}
        >
          <span className="text-gray-400 text-xs">表</span>
        </div>
      );

    default:
      return null;
  }
}

export default function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // プレビューのスケール計算
  const maxPreviewWidth = 400;
  const maxPreviewHeight = 500;
  const scale = Math.min(
    maxPreviewWidth / template.width_mm,
    maxPreviewHeight / template.height_mm
  );
  const previewWidth = template.width_mm * scale;
  const previewHeight = template.height_mm * scale;

  const elements = template.design_data?.elements || [];

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{template.name}</h2>
            <p className="text-sm text-gray-500">
              {templateTypeLabels[template.type] || template.type} - {template.width_mm}×{template.height_mm}mm
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* プレビュー */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="flex justify-center">
            <div
              className="bg-white shadow-lg relative"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                border: template.design_data?.border 
                  ? `${template.design_data.border.width}px ${template.design_data.border.style} ${template.design_data.border.color}`
                  : '1px solid #e5e7eb',
                backgroundColor: template.design_data?.background_color || '#ffffff',
              }}
            >
              {elements.length > 0 ? (
                elements.map((element) => renderElement(element, scale))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">📋</span>
                    <p className="text-sm">空のテンプレート</p>
                    <p className="text-xs mt-1">デザイン編集で要素を追加できます</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* テンプレート情報 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">サイズ</span>
              <p className="font-medium">{template.width_mm}×{template.height_mm}mm</p>
            </div>
            <div>
              <span className="text-gray-500">タイプ</span>
              <p className="font-medium">{templateTypeLabels[template.type] || template.type}</p>
            </div>
            <div>
              <span className="text-gray-500">要素数</span>
              <p className="font-medium">{elements.length}個</p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSelect}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            このテンプレートで作成
          </button>
        </div>
      </div>
    </div>
  );
}
