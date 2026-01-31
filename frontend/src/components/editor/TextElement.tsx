'use client';

import { useRef, useState, useEffect } from 'react';
import { TextElement as TextElementType } from '@/types/editor';

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElementType>) => void;
}

export default function TextElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: TextElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // mm → px 変換 (96dpi基準: 1mm ≒ 3.78px)
  const mmToPx = (mm: number) => mm * 3.78 * scale;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position.x * 3.78 * scale,
      y: e.clientY - element.position.y * 3.78 * scale,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragStart.x) / (3.78 * scale);
      const newY = (e.clientY - dragStart.y) / (3.78 * scale);
      onUpdate({
        position: {
          x: Math.round(newX * 10) / 10, // 0.1mm単位に丸める
          y: Math.round(newY * 10) / 10,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, onUpdate]);

  return (
    <div
      ref={elementRef}
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        width: mmToPx(element.size.width),
        minHeight: mmToPx(element.size.height),
        fontFamily: element.style.fontFamily,
        fontSize: element.style.fontSize * scale,
        fontWeight: element.style.fontWeight,
        color: element.style.color,
        textAlign: element.style.textAlign,
        zIndex: element.zIndex,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {element.content || 'テキストを入力'}
      
      {/* 選択時のリサイズハンドル */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
}
