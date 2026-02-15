'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import { EditorElement } from '@/types/editor';
import { getUsedColumns, calculateTaxIncludedPrice, formatPriceNumber } from '@/lib/placeholderUtils';

interface ProductDataTableProps {
  products: Product[];
  elements: EditorElement[];
  currentIndex: number;
  onSelectProduct: (index: number) => void;
  roundingMethod: 'round' | 'floor' | 'ceil';
  onEditProduct?: (index: number, field: string, value: string) => void;
  summarizeFlags?: boolean[];
  onToggleSummarize?: (index: number) => void;
  onToggleAllSummarize?: (enabled: boolean) => void;
}

/**
 * 商品データテーブル（列リサイズ・行展開対応）
 */
export function ProductDataTable({
  products,
  elements,
  currentIndex,
  onSelectProduct,
  roundingMethod,
  onEditProduct,
  summarizeFlags,
  onToggleSummarize,
  onToggleAllSummarize,
}: ProductDataTableProps) {
  const usedColumns = useMemo(() => getUsedColumns(elements), [elements]);

  // テンプレートに{{description}}が含まれるかチェック
  const hasDescription = useMemo(() =>
    elements.some(el => el.type === 'text' && (el as any).content?.includes('{{description}}')),
    [elements]
  );
  const showSummarizeColumn = hasDescription && !!summarizeFlags && !!onToggleSummarize;

  // 全選択チェックボックスの状態
  const allSummarizeEnabled = summarizeFlags?.every(Boolean) ?? true;
  const noneSummarizeEnabled = summarizeFlags?.every(v => !v) ?? false;

  // 列幅の状態
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    usedColumns.forEach(col => {
      widths[col.key] = col.key === 'productName' ? 200 : col.key === 'description' ? 350 : 100;
    });
    return widths;
  });

  // 展開中の行
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // リサイズ中の状態（refで管理してグローバルイベントで使う）
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] || 120 };
    setIsResizing(true);
  }, [columnWidths]);

  // グローバルマウスイベントでリサイズ処理（テーブル外にマウスが出ても追従する）
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const diff = e.clientX - r.startX;
      const newWidth = Math.max(60, r.startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [r.key]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 行の展開/折りたたみ
  const toggleRowExpand = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const getTaxIncludedPrice = useCallback((product: Product): number => {
    const taxDivision = product.taxDivision || '1';
    if (taxDivision === '0' || taxDivision === '2') return product.price;
    return calculateTaxIncludedPrice(product.price, product.taxRate || 10, roundingMethod);
  }, [roundingMethod]);

  const getCellValue = useCallback((product: Product, key: string): string => {
    switch (key) {
      case 'productName': return product.productName || '';
      case 'price': return `¥${formatPriceNumber(product.price)}`;
      case 'taxIncludedPrice': return `¥${formatPriceNumber(getTaxIncludedPrice(product))}`;
      case 'description': return product.description || '';
      case 'maker': return product.maker || product.tag || '';
      case 'taxRate': return `${product.taxRate || 10}%`;
      case 'category': return product.categoryName || '';
      case 'productCode': return product.productCode || '';
      default: return '';
    }
  }, [getTaxIncludedPrice]);

  const isEditable = (key: string): boolean =>
    ['productName', 'price', 'description', 'maker'].includes(key);

  const handleCellEdit = useCallback((index: number, key: string, value: string) => {
    if (onEditProduct && isEditable(key)) {
      onEditProduct(index, key, value);
    }
  }, [onEditProduct]);

  if (products.length === 0) {
    return <div className="text-center py-8 text-gray-500">商品データがありません</div>;
  }

  // テーブルの総幅を計算
  const summarizeColWidth = showSummarizeColumn ? 64 : 0;
  const totalWidth = 32 + 40 + summarizeColWidth + usedColumns.reduce((sum, col) => sum + (columnWidths[col.key] || 120), 0);

  return (
    <div
      className="overflow-auto border border-gray-200 rounded-lg bg-white"
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      <table style={{ width: totalWidth, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: 32 }} />
          <col style={{ width: 40 }} />
          {showSummarizeColumn && <col style={{ width: summarizeColWidth }} />}
          {usedColumns.map(col => (
            <col key={col.key} style={{ width: columnWidths[col.key] || 120 }} />
          ))}
        </colgroup>
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200" />
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">
              #
            </th>
            {showSummarizeColumn && (
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] leading-tight">AI要約</span>
                  <input
                    type="checkbox"
                    checked={allSummarizeEnabled}
                    ref={(el) => { if (el) el.indeterminate = !allSummarizeEnabled && !noneSummarizeEnabled; }}
                    onChange={() => onToggleAllSummarize?.(!allSummarizeEnabled)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title={allSummarizeEnabled ? '全て解除' : '全て選択'}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </th>
            )}
            {usedColumns.map((col) => (
              <th
                key={col.key}
                className="relative px-3 py-2 text-left text-xs font-medium text-gray-600 border-b border-gray-200 select-none"
              >
                <span className="truncate block">{col.label}</span>
                {/* リサイズハンドル */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-20"
                  onMouseDown={(e) => handleResizeStart(e, col.key)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const isExpanded = expandedRows.has(index);
            return (
              <tr
                key={product.productId || index}
                onClick={() => onSelectProduct(index)}
                className={`
                  cursor-pointer transition-colors
                  ${index === currentIndex
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }
                `}
              >
                {/* 展開ボタン */}
                <td className="px-1 py-2 text-center border-b border-gray-100">
                  <button
                    onClick={(e) => toggleRowExpand(index, e)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors rounded hover:bg-blue-50"
                    title={isExpanded ? '折りたたむ' : '展開する'}
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </td>
                {/* 行番号 */}
                <td className="px-2 py-2 text-center text-xs text-gray-400 border-b border-gray-100">
                  {index + 1}
                </td>
                {/* AI要約チェック */}
                {showSummarizeColumn && (
                  <td className="px-1 py-2 text-center border-b border-gray-100">
                    <input
                      type="checkbox"
                      checked={summarizeFlags?.[index] ?? true}
                      onChange={() => onToggleSummarize?.(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title={summarizeFlags?.[index] ? 'AI要約を無効にする' : 'AI要約を有効にする'}
                    />
                  </td>
                )}
                {/* データセル */}
                {usedColumns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-sm text-left border-b border-gray-100 overflow-hidden"
                  >
                    {isEditable(col.key) && onEditProduct ? (
                      isExpanded ? (
                        <textarea
                          value={col.key === 'price' ? String(product.price) : getCellValue(product, col.key)}
                          onChange={(e) => handleCellEdit(index, col.key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1 py-0.5 border border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-white resize-y min-h-[60px]"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={col.key === 'price' ? 'number' : 'text'}
                          value={col.key === 'price' ? product.price : getCellValue(product, col.key)}
                          onChange={(e) => handleCellEdit(index, col.key, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-transparent truncate"
                        />
                      )
                    ) : (
                      <span className={`block text-gray-700 text-left ${isExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
                        {getCellValue(product, col.key)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductDataTable;
