'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizableSplitProps {
  /** 上部（または左部）のコンテンツ */
  topContent: ReactNode;
  /** 下部（または右部）のコンテンツ */
  bottomContent: ReactNode;
  /** 分割方向 */
  direction?: 'horizontal' | 'vertical';
  /** 初期の上部（または左部）の高さ/幅（px） */
  initialSize?: number;
  /** 最小サイズ（px） */
  minSize?: number;
  /** 最大サイズ（px） */
  maxSize?: number;
  /** サイズ変更時のコールバック */
  onSizeChange?: (size: number) => void;
  /** コンテナのクラス名 */
  className?: string;
}

/**
 * リサイズ可能な分割パネルコンポーネント
 * 上部（プレビュー）の高さを固定値で管理し、下部（テーブル）が残りを埋める
 */
export function ResizableSplit({
  topContent,
  bottomContent,
  direction = 'vertical',
  initialSize = 400,
  minSize = 200,
  maxSize = 800,
  onSizeChange,
  className = '',
}: ResizableSplitProps) {
  const [topSize, setTopSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (direction === 'vertical') {
      startPosRef.current = e.clientY;
    } else {
      startPosRef.current = e.clientX;
    }
    startSizeRef.current = topSize;
  }, [direction, topSize]);

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let delta: number;
      if (direction === 'vertical') {
        delta = e.clientY - startPosRef.current;
      } else {
        delta = e.clientX - startPosRef.current;
      }

      let newSize = startSizeRef.current + delta;
      // 範囲制限
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setTopSize(newSize);
      onSizeChange?.(newSize);
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
  }, [isDragging, direction, minSize, maxSize, onSizeChange]);

  const isVertical = direction === 'vertical';

  return (
    <div
      ref={containerRef}
      className={`flex ${isVertical ? 'flex-col' : 'flex-row'} ${className}`}
      style={{ cursor: isDragging ? (isVertical ? 'row-resize' : 'col-resize') : 'default' }}
    >
      {/* 上部（または左部）- 固定サイズ */}
      <div
        className="flex-shrink-0 overflow-auto"
        style={{
          [isVertical ? 'height' : 'width']: `${topSize}px`,
        }}
      >
        {topContent}
      </div>

      {/* リサイズハンドル */}
      <div
        className={`
          flex-shrink-0 bg-gray-100 hover:bg-blue-200 transition-colors relative
          ${isVertical ? 'h-2 cursor-row-resize' : 'w-2 cursor-col-resize'}
          ${isDragging ? 'bg-blue-400' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* ハンドルのビジュアルインジケーター */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center
          `}
        >
          <div className={`bg-gray-400 rounded-full ${isVertical ? 'w-10 h-1' : 'h-10 w-1'}`} />
        </div>
      </div>

      {/* 下部（または右部）- 残りを埋める */}
      <div className="flex-1 overflow-auto min-h-0">
        {bottomContent}
      </div>
    </div>
  );
}

export default ResizableSplit;
