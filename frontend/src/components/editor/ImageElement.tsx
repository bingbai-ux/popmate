'use client';

import { useState, useEffect } from 'react';
import { ImageElement as ImageElementType } from '@/types/editor';

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

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - dragStart.x) / (3.78 * scale);
      const newY = (e.clientY - dragStart.y) / (3.78 * scale);
      onUpdate({
        position: {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        },
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, onUpdate]);

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
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
}
