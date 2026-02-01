'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizableSplitProps {
  /** 上部（または左部）のコンテンツ */
  topContent: ReactNode;
  /** 下部（または右部）のコンテンツ */
  bottomContent: ReactNode;
  /** 分割方向 */
  direction?: 'horizontal' | 'vertical';
  /** 初期の上部（または左部）の比率（0-100） */
  initialRatio?: number;
  /** 最小比率（0-100） */
  minRatio?: number;
  /** 最大比率（0-100） */
  maxRatio?: number;
  /** 比率変更時のコールバック */
  onRatioChange?: (ratio: number) => void;
  /** コンテナのクラス名 */
  className?: string;
}

/**
 * リサイズ可能な分割パネルコンポーネント
 */
export function ResizableSplit({
  topContent,
  bottomContent,
  direction = 'vertical',
  initialRatio = 50,
  minRatio = 20,
  maxRatio = 80,
  onRatioChange,
  className = '',
}: ResizableSplitProps) {
  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newRatio: number;

      if (direction === 'vertical') {
        // 縦分割: 上下
        newRatio = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        // 横分割: 左右
        newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      }

      // 範囲制限
      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      setRatio(newRatio);
      onRatioChange?.(newRatio);
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
  }, [isDragging, direction, minRatio, maxRatio, onRatioChange]);

  const isVertical = direction === 'vertical';

  return (
    <div
      ref={containerRef}
      className={`flex ${isVertical ? 'flex-col' : 'flex-row'} ${className}`}
      style={{ cursor: isDragging ? (isVertical ? 'row-resize' : 'col-resize') : 'default' }}
    >
      {/* 上部（または左部） */}
      <div
        style={{
          [isVertical ? 'height' : 'width']: `${ratio}%`,
          overflow: 'auto',
        }}
      >
        {topContent}
      </div>

      {/* リサイズハンドル */}
      <div
        className={`
          flex-shrink-0 bg-gray-200 hover:bg-blue-400 transition-colors
          ${isVertical ? 'h-1.5 cursor-row-resize' : 'w-1.5 cursor-col-resize'}
          ${isDragging ? 'bg-blue-500' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* ハンドルのビジュアルインジケーター */}
        <div
          className={`
            flex items-center justify-center h-full w-full
            ${isVertical ? 'flex-row' : 'flex-col'}
          `}
        >
          <div className={`bg-gray-400 rounded-full ${isVertical ? 'w-8 h-0.5' : 'h-8 w-0.5'}`} />
        </div>
      </div>

      {/* 下部（または右部） */}
      <div
        style={{
          [isVertical ? 'height' : 'width']: `${100 - ratio}%`,
          overflow: 'auto',
        }}
      >
        {bottomContent}
      </div>
    </div>
  );
}

export default ResizableSplit;
