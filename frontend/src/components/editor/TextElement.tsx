'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { TextElement as TextElementType } from '@/types/editor';

interface TextElementProps {
  element: TextElementType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextElementType>) => void;
}

type ResizeDirection = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export default function TextElement({
  element,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: TextElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // ★ インライン編集モード
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

  // mm → px 変換 (96dpi基準: 1mm ≒ 3.78px)
  const mmToPx = useCallback((mm: number) => mm * 3.78 * scale, [scale]);
  const pxToMm = useCallback((px: number) => px / (3.78 * scale), [scale]);

  // ★ ダブルクリックで編集モードに入る
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    setIsDragging(false);
  };

  // ★ 編集モード開始時にフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // ★ 編集完了（フォーカスアウト or Escape）
  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    // Enterで改行（Shift+Enterも改行）
    // 編集終了はフォーカスアウトで
  };

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;  // 編集中はドラッグしない
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.position.x * 3.78 * scale,
      y: e.clientY - element.position.y * 3.78 * scale,
    });
  };

  // リサイズ開始
  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
      posX: element.position.x,
      posY: element.position.y,
    });
  };

  // ドラッグ処理
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

  // リサイズ処理
  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = pxToMm(e.clientX - resizeStart.x);
      const deltaY = pxToMm(e.clientY - resizeStart.y);

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newPosX = resizeStart.posX;
      let newPosY = resizeStart.posY;

      // 方向に応じてサイズと位置を計算
      switch (resizeDirection) {
        case 'se': // 右下
          newWidth = Math.max(5, resizeStart.width + deltaX);
          newHeight = Math.max(5, resizeStart.height + deltaY);
          break;
        case 'sw': // 左下
          newWidth = Math.max(5, resizeStart.width - deltaX);
          newHeight = Math.max(5, resizeStart.height + deltaY);
          newPosX = resizeStart.posX + (resizeStart.width - newWidth);
          break;
        case 'ne': // 右上
          newWidth = Math.max(5, resizeStart.width + deltaX);
          newHeight = Math.max(5, resizeStart.height - deltaY);
          newPosY = resizeStart.posY + (resizeStart.height - newHeight);
          break;
        case 'nw': // 左上
          newWidth = Math.max(5, resizeStart.width - deltaX);
          newHeight = Math.max(5, resizeStart.height - deltaY);
          newPosX = resizeStart.posX + (resizeStart.width - newWidth);
          newPosY = resizeStart.posY + (resizeStart.height - newHeight);
          break;
        case 'e': // 右
          newWidth = Math.max(5, resizeStart.width + deltaX);
          break;
        case 'w': // 左
          newWidth = Math.max(5, resizeStart.width - deltaX);
          newPosX = resizeStart.posX + (resizeStart.width - newWidth);
          break;
        case 's': // 下
          newHeight = Math.max(5, resizeStart.height + deltaY);
          break;
        case 'n': // 上
          newHeight = Math.max(5, resizeStart.height - deltaY);
          newPosY = resizeStart.posY + (resizeStart.height - newHeight);
          break;
      }

      onUpdate({
        size: {
          width: Math.round(newWidth * 10) / 10,
          height: Math.round(newHeight * 10) / 10,
        },
        position: {
          x: Math.round(newPosX * 10) / 10,
          y: Math.round(newPosY * 10) / 10,
        },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, pxToMm, onUpdate]);

  // テキストスタイルの計算
  const textStyle: React.CSSProperties = {
    fontFamily: element.style.fontFamily,
    fontSize: element.style.fontSize * scale,
    fontWeight: element.style.fontWeight,
    fontStyle: element.style.fontStyle,
    textDecoration: element.style.textDecoration,
    color: element.style.color,
    textAlign: element.style.textAlign,
    letterSpacing: element.style.letterSpacing * scale,
    lineHeight: `${element.style.lineHeight}%`,
    opacity: element.style.opacity / 100,
    writingMode: element.style.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
    transform: element.style.textWidth !== 100 ? `scaleX(${element.style.textWidth / 100})` : undefined,
    transformOrigin: 'left top',
    whiteSpace: element.style.autoWrap ? 'pre-wrap' : 'nowrap',
    overflow: 'hidden',
  };

  // 垂直配置のスタイル
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: element.style.verticalAlign === 'top' ? 'flex-start' 
      : element.style.verticalAlign === 'bottom' ? 'flex-end' 
      : 'center',
    height: '100%',
  };

  // ★ 編集用textareaのスタイル
  const editTextareaStyle: React.CSSProperties = {
    ...textStyle,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid #3b82f6',
    borderRadius: '2px',
    padding: '2px',
    resize: 'none',
    outline: 'none',
  };

  return (
    <div
      ref={elementRef}
      className={`absolute ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{
        left: mmToPx(element.position.x),
        top: mmToPx(element.position.y),
        width: mmToPx(element.size.width),
        height: mmToPx(element.size.height),
        zIndex: element.zIndex,
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        // ★ 編集モード: textarea表示
        <textarea
          ref={inputRef}
          value={element.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={editTextareaStyle}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        // 表示モード
        <div style={containerStyle}>
          <div style={textStyle}>
            {element.content || (
              <span className="text-gray-400 italic">ダブルクリックで編集</span>
            )}
          </div>
        </div>
      )}
      
      {/* 選択時のリサイズハンドル（編集中は非表示） */}
      {isSelected && !isEditing && (
        <>
          {/* 四隅のハンドル */}
          <div 
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-nw-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div 
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-ne-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div 
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-full cursor-sw-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div 
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* 辺の中央のハンドル */}
          <div 
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-n-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div 
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-s-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div 
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-primary rounded-full cursor-w-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div 
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-primary rounded-full cursor-e-resize hover:bg-primary/80 z-10"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
