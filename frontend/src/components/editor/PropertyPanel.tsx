'use client';

import { useState } from 'react';
import { EditorElement, TextElement } from '@/types/editor';
import PlaceholderMenu from './PlaceholderMenu';

interface PropertyPanelProps {
  element: EditorElement | null;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
}

export default function PropertyPanel({ element, onUpdate, onDelete }: PropertyPanelProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  if (!element) {
    return (
      <div className="w-72 bg-white border-l border-border p-4">
        <p className="text-sm text-gray-500 text-center">
          要素を選択してください
        </p>
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdate(element.id, {
      position: { ...element.position, [axis]: numValue },
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdate(element.id, {
      size: { ...element.size, [dimension]: numValue },
    });
  };

  const handleTextStyleChange = (key: string, value: string | number) => {
    if (element.type !== 'text') return;
    onUpdate(element.id, {
      style: { ...element.style, [key]: value },
    } as Partial<TextElement>);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (element.type !== 'text') return;
    onUpdate(element.id, {
      content: element.content + placeholder,
    } as Partial<TextElement>);
  };

  return (
    <div className="w-72 bg-white border-l border-border overflow-y-auto">
      {/* ヘッダー */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm">
          {element.type === 'text' ? 'テキスト' : '画像'}
        </h3>
        <button
          onClick={() => onDelete(element.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="削除"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* 位置 */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">位置 (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">X</label>
              <input
                type="number"
                step="0.1"
                value={element.position.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Y</label>
              <input
                type="number"
                step="0.1"
                value={element.position.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* サイズ */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">サイズ (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">幅</label>
              <input
                type="number"
                step="0.1"
                value={element.size.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">高さ</label>
              <input
                type="number"
                step="0.1"
                value={element.size.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* テキスト固有の設定 */}
        {element.type === 'text' && (
          <>
            {/* テキスト内容 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">テキスト</label>
                <div className="relative">
                  <button
                    onClick={() => setShowPlaceholders(!showPlaceholders)}
                    className="text-xs text-primary hover:underline"
                  >
                    + 変数を挿入
                  </button>
                  {showPlaceholders && (
                    <PlaceholderMenu
                      onSelect={insertPlaceholder}
                      onClose={() => setShowPlaceholders(false)}
                    />
                  )}
                </div>
              </div>
              <textarea
                value={element.content}
                onChange={(e) => onUpdate(element.id, { content: e.target.value } as Partial<TextElement>)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">
                {element.content.length} 文字
              </p>
            </div>

            {/* フォント */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">フォント</label>
              <select
                value={element.style.fontFamily}
                onChange={(e) => handleTextStyleChange('fontFamily', e.target.value)}
                className="w-full px-2 py-1.5 border border-border rounded text-sm"
              >
                <option value="Noto Sans JP">Noto Sans JP</option>
                <option value="Noto Serif JP">Noto Serif JP</option>
                <option value="M PLUS Rounded 1c">M PLUS Rounded 1c</option>
              </select>
            </div>

            {/* フォントサイズ・太さ */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">サイズ (pt)</label>
                <input
                  type="number"
                  min="6"
                  max="200"
                  value={element.style.fontSize}
                  onChange={(e) => handleTextStyleChange('fontSize', parseInt(e.target.value) || 14)}
                  className="w-full px-2 py-1.5 border border-border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">太さ</label>
                <select
                  value={element.style.fontWeight}
                  onChange={(e) => handleTextStyleChange('fontWeight', e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded text-sm"
                >
                  <option value="normal">標準</option>
                  <option value="bold">太字</option>
                </select>
              </div>
            </div>

            {/* 色 */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={element.style.color}
                  onChange={(e) => handleTextStyleChange('color', e.target.value)}
                  className="w-10 h-10 border border-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.style.color}
                  onChange={(e) => handleTextStyleChange('color', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-border rounded text-sm"
                />
              </div>
            </div>

            {/* 配置 */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">配置</label>
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => handleTextStyleChange('textAlign', align)}
                    className={`flex-1 py-2 rounded border transition-colors ${
                      element.style.textAlign === align
                        ? 'bg-primary text-white border-primary'
                        : 'border-border hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      {align === 'left' && <path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />}
                      {align === 'center' && <path d="M3 5h18v2H3V5zm3 4h12v2H6V9zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z" />}
                      {align === 'right' && <path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z" />}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
