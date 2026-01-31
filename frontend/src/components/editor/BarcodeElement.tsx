'use client';

import { useState, useEffect, useRef } from 'react';
import { BarcodeElement as BarcodeElementType } from '@/types/editor';

interface BarcodeElementProps {
  element: BarcodeElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<BarcodeElementType>) => void;
}

export default function BarcodeElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: BarcodeElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [barcodeLoaded, setBarcodeLoaded] = useState(false);

  const mmToPx = (mm: number) => mm * 3.78 * scale;

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as unknown as { JsBarcode?: unknown }).JsBarcode) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      script.onload = () => setBarcodeLoaded(true);
      document.head.appendChild(script);
    } else {
      setBarcodeLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current || !barcodeLoaded) return;

    try {
      const JsBarcode = (window as unknown as { JsBarcode?: (el: SVGSVGElement, value: string, options: object) => void }).JsBarcode;
      if (JsBarcode) {
        let value = element.settings.value || '123456789';
        if (value.includes('{{')) {
          value = '4901234567890';
        }

        JsBarcode(svgRef.current, value, {
          format: element.settings.format,
          displayValue: element.settings.displayValue,
          fontSize: element.settings.fontSize * scale,
          lineColor: element.settings.lineColor,
          background: element.settings.background,
          width: 2,
          height: 50 * scale,
          margin: 5,
        });
      }
    } catch (error) {
      console.error('Barcode generation error:', error);
    }
  }, [element.settings, scale, barcodeLoaded]);

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
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        zIndex: element.zIndex,
        background: element.settings.background,
        padding: '4px',
        borderRadius: '4px',
      }}
      onMouseDown={handleMouseDown}
    >
      <svg ref={svgRef} />

      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full" />
        </>
      )}
    </div>
  );
}
