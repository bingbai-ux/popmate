'use client';

import { useState, useEffect } from 'react';
import { ImageElement as ImageElementType } from '@/types/editor';

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

interface ImageElementProps {
  element: ImageElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageElementType>) => void;
}

export default function ImageElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: ImageElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

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

  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: element.size.width, height: element.size.height });
    setInitialPosition({ x: element.position.x, y: element.position.y });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = (e.clientX - dragStart.x) / (3.78 * scale);
        const newY = (e.clientY - dragStart.y) / (3.78 * scale);
        onUpdate({
          position: {
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
          },
        });
      } else if (isResizing && resizeDirection) {
        const deltaX = (e.clientX - dragStart.x) / (3.78 * scale);
        const deltaY = (e.clientY - dragStart.y) / (3.78 * scale);

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPosition.x;
        let newY = initialPosition.y;

        // リサイズ方向に応じてサイズと位置を計算
        switch (resizeDirection) {
          case 'se': // 右下
            newWidth = Math.max(5, initialSize.width + deltaX);
            newHeight = Math.max(5, initialSize.height + deltaY);
            break;
          case 'sw': // 左下
            newWidth = Math.max(5, initialSize.width - deltaX);
            newHeight = Math.max(5, initialSize.height + deltaY);
            newX = initialPosition.x + (initialSize.width - newWidth);
            break;
          case 'ne': // 右上
            newWidth = Math.max(5, initialSize.width + deltaX);
            newHeight = Math.max(5, initialSize.height - deltaY);
            newY = initialPosition.y + (initialSize.height - newHeight);
            break;
          case 'nw': // 左上
            newWidth = Math.max(5, initialSize.width - deltaX);
            newHeight = Math.max(5, initialSize.height - deltaY);
            newX = initialPosition.x + (initialSize.width - newWidth);
            newY = initialPosition.y + (initialSize.height - newHeight);
            break;
          case 'e': // 右
            newWidth = Math.max(5, initialSize.width + deltaX);
            break;
          case 'w': // 左
            newWidth = Math.max(5, initialSize.width - deltaX);
            newX = initialPosition.x + (initialSize.width - newWidth);
            break;
          case 's': // 下
            newHeight = Math.max(5, initialSize.height + deltaY);
            break;
          case 'n': // 上
            newHeight = Math.max(5, initialSize.height - deltaY);
            newY = initialPosition.y + (initialSize.height - newHeight);
            break;
        }

        onUpdate({
          size: {
            width: Math.round(newWidth * 10) / 10,
            height: Math.round(newHeight * 10) / 10,
          },
          position: {
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
          },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragStart, scale, onUpdate, initialSize, initialPosition]);

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        width: mmToPx(element.size.width),
        height: mmToPx(element.size.height),
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={element.src}
        alt={element.alt}
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {isSelected && (
        <>
          {/* 4隅のリサイズハンドル */}
          <div
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nw-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-ne-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-sw-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          {/* 4辺の中央のリサイズハンドル */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full cursor-n-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full cursor-s-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary rounded-full cursor-w-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-primary rounded-full cursor-e-resize hover:bg-primary/80"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
