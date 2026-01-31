'use client';

import { useState, useEffect } from 'react';
import { QRCodeElement as QRCodeElementType } from '@/types/editor';

interface QRCodeElementProps {
  element: QRCodeElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<QRCodeElementType>) => void;
}

export default function QRCodeElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: QRCodeElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoaded, setQrLoaded] = useState(false);

  const mmToPx = (mm: number) => mm * 3.78 * scale;

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as unknown as { QRCode?: unknown }).QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
      script.onload = () => setQrLoaded(true);
      document.head.appendChild(script);
    } else {
      setQrLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!qrLoaded) return;

    const generateQR = async () => {
      try {
        const QRCode = (window as unknown as { QRCode?: { toDataURL: (value: string, options: object) => Promise<string> } }).QRCode;
        if (QRCode) {
          let value = element.settings.value || 'https://example.com';
          if (value.includes('{{')) {
            value = 'https://popmate.vercel.app';
          }

          const dataUrl = await QRCode.toDataURL(value, {
            width: element.settings.size * scale,
            margin: 1,
            color: {
              dark: element.settings.fgColor,
              light: element.settings.bgColor,
            },
            errorCorrectionLevel: element.settings.errorCorrectionLevel,
          });
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('QR code generation error:', error);
      }
    };

    generateQR();
  }, [element.settings, scale, qrLoaded]);

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
        const newSize = Math.max(10, element.size.width + deltaX);
        onUpdate({
          size: { width: newSize, height: newSize },
          settings: { ...element.settings, size: newSize * 3.78 },
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

  const size = mmToPx(element.size.width);

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        width: size,
        height: size,
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="w-full h-full" draggable={false} />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-300 rounded"
          style={{ background: element.settings.bgColor }}
        >
          QRコード
        </div>
      )}

      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full" />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize"
            onMouseDown={handleResizeStart}
          />
        </>
      )}
    </div>
  );
}
