'use client';

import { useState, useEffect } from 'react';
import { LineElement as LineElementType } from '@/types/editor';

interface LineElementProps {
  element: LineElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<LineElementType>) => void;
}

export default function LineElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: LineElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<'line' | 'start' | 'end'>('line');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mmToPx = (mm: number) => mm * 3.78 * scale;

  const handleLineMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragTarget('line');
    setDragStart({
      x: e.clientX - element.position.x * 3.78 * scale,
      y: e.clientY - element.position.y * 3.78 * scale,
    });
  };

  const handlePointMouseDown = (e: React.MouseEvent, point: 'start' | 'end') => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragTarget(point);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragTarget === 'line') {
        const newX = (e.clientX - dragStart.x) / (3.78 * scale);
        const newY = (e.clientY - dragStart.y) / (3.78 * scale);
        onUpdate({
          position: {
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
          },
        });
      } else {
        const deltaX = (e.clientX - dragStart.x) / (3.78 * scale);
        const deltaY = (e.clientY - dragStart.y) / (3.78 * scale);
        
        if (dragTarget === 'start') {
          onUpdate({
            startPoint: {
              x: Math.round((element.startPoint.x + deltaX) * 10) / 10,
              y: Math.round((element.startPoint.y + deltaY) * 10) / 10,
            },
          });
        } else {
          onUpdate({
            endPoint: {
              x: Math.round((element.endPoint.x + deltaX) * 10) / 10,
              y: Math.round((element.endPoint.y + deltaY) * 10) / 10,
            },
          });
        }
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragTarget, dragStart, scale, element, onUpdate]);

  const { stroke, strokeWidth, strokeOpacity, endArrow } = element.style;
  const x1 = mmToPx(element.startPoint.x);
  const y1 = mmToPx(element.startPoint.y);
  const x2 = mmToPx(element.endPoint.x);
  const y2 = mmToPx(element.endPoint.y);

  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const width = Math.abs(x2 - x1) + 20;
  const height = Math.abs(y2 - y1) + 20;

  return (
    <div
      className="absolute"
      style={{
        left: mmToPx(element.position.x) + minX - 10,
        top: mmToPx(element.position.y) + minY - 10,
        width: width,
        height: height,
        zIndex: element.zIndex,
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="overflow-visible cursor-move"
        onMouseDown={handleLineMouseDown}
      >
        <defs>
          <marker
            id={`arrowhead-${element.id}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={stroke}
              fillOpacity={strokeOpacity / 100}
            />
          </marker>
        </defs>
        <line
          x1={x1 - minX + 10}
          y1={y1 - minY + 10}
          x2={x2 - minX + 10}
          y2={y2 - minY + 10}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity / 100}
          markerEnd={endArrow ? `url(#arrowhead-${element.id})` : undefined}
        />
      </svg>

      {isSelected && (
        <>
          <div
            className="absolute w-4 h-4 bg-primary rounded-full cursor-move border-2 border-white shadow"
            style={{ left: x1 - minX + 10 - 8, top: y1 - minY + 10 - 8 }}
            onMouseDown={(e) => handlePointMouseDown(e, 'start')}
          />
          <div
            className="absolute w-4 h-4 bg-primary rounded-full cursor-move border-2 border-white shadow"
            style={{ left: x2 - minX + 10 - 8, top: y2 - minY + 10 - 8 }}
            onMouseDown={(e) => handlePointMouseDown(e, 'end')}
          />
        </>
      )}
    </div>
  );
}
