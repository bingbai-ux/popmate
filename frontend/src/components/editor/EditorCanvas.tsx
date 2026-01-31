'use client';

import { EditorElement, TemplateConfig } from '@/types/editor';
import TextElement from './TextElement';
import ImageElement from './ImageElement';

interface EditorCanvasProps {
  template: TemplateConfig;
  elements: EditorElement[];
  selectedElementId: string | null;
  zoom: number;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
}

export default function EditorCanvas({
  template,
  elements,
  selectedElementId,
  zoom,
  onSelectElement,
  onUpdateElement,
}: EditorCanvasProps) {
  // mm → px 変換
  const mmToPx = (mm: number) => mm * 3.78 * zoom;

  const handleCanvasClick = () => {
    onSelectElement(null);
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8 flex items-center justify-center">
      {/* キャンバスコンテナ */}
      <div
        className="bg-white shadow-lg relative"
        style={{
          width: mmToPx(template.width),
          height: mmToPx(template.height),
        }}
        onClick={handleCanvasClick}
      >
        {/* グリッド（5mm間隔） */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
          }}
        />

        {/* 要素をレンダリング */}
        {elements.map((element) => {
          if (element.type === 'text') {
            return (
              <TextElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                scale={zoom}
                onSelect={() => onSelectElement(element.id)}
                onUpdate={(updates) => onUpdateElement(element.id, updates)}
              />
            );
          }
          if (element.type === 'image') {
            return (
              <ImageElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                scale={zoom}
                onSelect={() => onSelectElement(element.id)}
                onUpdate={(updates) => onUpdateElement(element.id, updates)}
              />
            );
          }
          return null;
        })}

        {/* テンプレート情報 */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {template.width} × {template.height} mm
        </div>
      </div>
    </div>
  );
}
