'use client';

import { useState, useEffect } from 'react';
import { ShapeElement as ShapeElementType } from '@/types/editor';

interface ShapeElementProps {
  element: ShapeElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ShapeElementType>) => void;
}

export default function ShapeElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: ShapeElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
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
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) / (3.78 * scale);
        const deltaY = (e.clientY - dragStart.y) / (3.78 * scale);
        onUpdate({
          size: {
            width: Math.max(5, Math.round((element.size.width + deltaX) * 10) / 10),
            height: Math.max(5, Math.round((element.size.height + deltaY) * 10) / 10),
          },
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, scale, element, onUpdate]);

  const renderShape = () => {
    const w = mmToPx(element.size.width);
    const h = mmToPx(element.size.height);
    const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, cornerRadius } = element.style;

    const commonProps = {
      fill: fill,
      fillOpacity: fillOpacity / 100,
      stroke: stroke,
      strokeWidth: strokeWidth,
      strokeOpacity: strokeOpacity / 100,
    };

    switch (element.shapeType) {
      case 'rectangle':
        return <rect width={w} height={h} {...commonProps} />;
      case 'roundedRect':
        return <rect width={w} height={h} rx={cornerRadius || 5} {...commonProps} />;
      case 'circle':
        return <ellipse cx={w/2} cy={h/2} rx={w/2} ry={h/2} {...commonProps} />;
      case 'triangle':
        return <polygon points={`${w/2},0 ${w},${h} 0,${h}`} {...commonProps} />;
      case 'star':
        const points = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? Math.min(w, h) / 2 : Math.min(w, h) / 4;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push(`${w/2 + r * Math.cos(angle)},${h/2 + r * Math.sin(angle)}`);
        }
        return <polygon points={points.join(' ')} {...commonProps} />;
      default:
        return <rect width={w} height={h} {...commonProps} />;
    }
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        width: mmToPx(element.size.width),
        height: mmToPx(element.size.height),
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      <svg width="100%" height="100%" className="overflow-visible">
        {renderShape()}
      </svg>

      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}
