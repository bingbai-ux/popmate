'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
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
}

/**
 * 商品データテーブル（変数連動 & 列リサイズ対応）
 */
export function ProductDataTable({
  products,
  elements,
  currentIndex,
  onSelectProduct,
  roundingMethod,
  onEditProduct,
}: ProductDataTableProps) {
  // 使用されている列を検出
  const usedColumns = useMemo(() => getUsedColumns(elements), [elements]);

  // 列幅の状態（初期値: 各列150px、商品名は200px）
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    usedColumns.forEach(col => {
      widths[col.key] = col.key === 'productName' ? 200 : 120;
    });
    return widths;
  });

  // リサイズ中の状態
  const [resizing, setResizing] = useState<{ key: string; startX: number; startWidth: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      key,
      startX: e.clientX,
      startWidth: columnWidths[key] || 120,
    });
  }, [columnWidths]);

  // リサイズ中
  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    // 最小幅60pxのみ、最大幅制限なし
    const newWidth = Math.max(60, resizing.startWidth + diff);
    setColumnWidths(prev => ({
      ...prev,
      [resizing.key]: newWidth,
    }));
  }, [resizing]);

  // リサイズ終了
  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  // 税込価格を計算
  const getTaxIncludedPrice = useCallback((product: Product): number => {
    const taxDivision = product.taxDivision || '1';
    const taxRate = product.taxRate || 10;
    
    if (taxDivision === '0' || taxDivision === '2') {
      return product.price;
    }
    return calculateTaxIncludedPrice(product.price, taxRate, roundingMethod);
  }, [roundingMethod]);

  // セルの値を取得
  const getCellValue = useCallback((product: Product, key: string): string => {
    switch (key) {
      case 'productName':
        return product.productName || '';
      case 'price':
        return `¥${formatPriceNumber(product.price)}`;
      case 'taxIncludedPrice':
        return `¥${formatPriceNumber(getTaxIncludedPrice(product))}`;
      case 'description':
        return product.description || '';
      case 'maker':
        return product.maker || product.groupCode || product.tag || '';
      case 'taxRate':
        return `${product.taxRate || 10}%`;
      case 'category':
        return product.categoryName || '';
      case 'productCode':
        return product.productCode || '';
      default:
        return '';
    }
  }, [getTaxIncludedPrice]);

  // 編集可能かどうか
  const isEditable = (key: string): boolean => {
    return ['productName', 'price', 'description', 'maker'].includes(key);
  };

  // セル編集
  const handleCellEdit = useCallback((index: number, key: string, value: string) => {
    if (onEditProduct && isEditable(key)) {
      onEditProduct(index, key, value);
    }
  }, [onEditProduct]);

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        商品データがありません
      </div>
    );
  }

  return (
    <div
      ref={tableRef}
      className="overflow-auto border border-gray-200 rounded-lg bg-white"
      onMouseMove={resizing ? handleResizeMove : undefined}
      onMouseUp={resizing ? handleResizeEnd : undefined}
      onMouseLeave={resizing ? handleResizeEnd : undefined}
      style={{ cursor: resizing ? 'col-resize' : 'default' }}
    >
      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {/* 行番号列 */}
            <th className="w-12 px-2 py-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">
              #
            </th>
            {/* データ列 */}
            {usedColumns.map((col, colIndex) => (
              <th
                key={col.key}
                className="relative px-3 py-2 text-left text-xs font-medium text-gray-600 border-b border-gray-200 select-none"
                style={{ width: columnWidths[col.key] || 120 }}
              >
                <span className="truncate block">{col.label}</span>
                {/* リサイズハンドル */}
                {colIndex < usedColumns.length - 1 && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors"
                    onMouseDown={(e) => handleResizeStart(e, col.key)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
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
              {/* 行番号 */}
              <td className="px-2 py-2 text-center text-xs text-gray-400 border-b border-gray-100">
                {index + 1}
              </td>
              {/* データセル */}
              {usedColumns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 py-2 text-sm border-b border-gray-100"
                  style={{ width: columnWidths[col.key] || 120 }}
                >
                  {isEditable(col.key) && onEditProduct ? (
                    <input
                      type={col.key === 'price' ? 'number' : 'text'}
                      value={col.key === 'price' ? product.price : getCellValue(product, col.key)}
                      onChange={(e) => handleCellEdit(index, col.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-1 py-0.5 border border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none rounded text-sm bg-transparent"
                    />
                  ) : (
                    <span className="truncate block text-gray-700">
                      {getCellValue(product, col.key)}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductDataTable;
