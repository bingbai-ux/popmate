'use client';

import { EditorElement, TemplateConfig } from '@/types/editor';
import TextElement from './TextElement';
import ImageElement from './ImageElement';
import ShapeElement from './ShapeElement';
import LineElement from './LineElement';
import BarcodeElement from './BarcodeElement';
import QRCodeElement from './QRCodeElement';

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
  const mmToPx = (mm: number) => mm * 3.78 * zoom;

  const handleCanvasClick = () => {
    onSelectElement(null);
  };

  const renderElement = (element: EditorElement) => {
    const isSelected = element.id === selectedElementId;

    switch (element.type) {
      case 'text':
        return (
          <TextElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      case 'image':
        return (
          <ImageElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      case 'shape':
        return (
          <ShapeElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      case 'line':
        return (
          <LineElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      case 'barcode':
        return (
          <BarcodeElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      case 'qrcode':
        return (
          <QRCodeElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={zoom}
            onSelect={() => onSelectElement(element.id)}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex-1 overflow-auto bg-gray-100 p-8"
      onClick={handleCanvasClick}
    >
      <div className="flex items-center justify-center min-h-full">
        <div
          className="bg-white shadow-lg relative"
          style={{
            width: mmToPx(template.width),
            height: mmToPx(template.height),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* グリッド */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
              opacity: 0.5,
            }}
          />

          {/* 要素 */}
          {elements.map(renderElement)}

          {/* テンプレート情報 */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {template.width} × {template.height} mm
          </div>
        </div>
      </div>
    </div>
  );
}
