'use client';

import { Dispatch, SetStateAction } from 'react';
import { Product } from '@/types/product';
import {
  FieldToggleState,
  CsvFieldMap,
  calcTaxIncludedPrice,
  resolveDisplayValue,
  hasCsvField,
} from '@/types/csvFieldToggle';

interface ProductTableProps {
  products: Product[];
  selectedIds: string[];
  onToggleSelect: (productId: string) => void;
  onSelectAll: () => void;
  isLoading: boolean;
  fieldToggleState?: FieldToggleState;
  onFieldToggleChange?: Dispatch<SetStateAction<FieldToggleState>>;
  csvFieldMap?: CsvFieldMap;
}

export default function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  isLoading,
  fieldToggleState = {},
  onFieldToggleChange,
  csvFieldMap = {},
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every(p => selectedIds.includes(p.productId));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  // CSVフィールドが存在するかチェック（ヘッダーチェックボックス表示判定）
  const hasCsvPrice = hasCsvField('price', csvFieldMap);
  const hasCsvDescription = hasCsvField('description', csvFieldMap);

  // チェックボックス切り替えハンドラ
  const handleFieldToggle = (fieldName: string, checked: boolean) => {
    if (onFieldToggleChange) {
      onFieldToggleChange(prev => ({ ...prev, [fieldName]: checked }));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-border p-8 text-center">
        <svg className="w-8 h-8 animate-spin text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-500">商品データを読み込み中...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-8 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500">商品が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-primary text-white">
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-bold">商品コード</th>
            <th className="px-4 py-3 text-left text-sm font-bold">商品名</th>
            <th className="px-4 py-3 text-left text-sm font-bold">カテゴリ</th>
            <th className="px-4 py-3 text-left text-sm font-bold">メーカー</th>
            {/* 説明列（CSVチェックボックス付き） */}
            <th className="px-4 py-3 text-left text-sm font-bold">
              <div className="flex items-center gap-1.5">
                <span>説明</span>
                {hasCsvDescription && (
                  <label className="flex items-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={fieldToggleState['description'] ?? false}
                      onChange={e => handleFieldToggle('description', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/50 text-white focus:ring-white/50"
                    />
                    <span className="text-xs font-normal opacity-80">CSV</span>
                  </label>
                )}
              </div>
            </th>
            {/* 税抜価格列（CSVチェックボックス付き） */}
            <th className="px-4 py-3 text-right text-sm font-bold">
              <div className="flex items-center justify-end gap-1.5">
                {hasCsvPrice && (
                  <label className="flex items-center gap-1 cursor-pointer" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={fieldToggleState['price'] ?? false}
                      onChange={e => handleFieldToggle('price', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/50 text-white focus:ring-white/50"
                    />
                    <span className="text-xs font-normal opacity-80">CSV</span>
                  </label>
                )}
                <span>税抜価格</span>
              </div>
            </th>
            {/* 税込価格列（チェックボックスなし・税抜に連動） */}
            <th className="px-4 py-3 text-right text-sm font-bold">税込価格</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            const isSelected = selectedIds.includes(product.productId);
            const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-background-muted';

            // 税抜価格の解決
            const { value: priceExStr, isFromCsv: priceIsFromCsv } = resolveDisplayValue(
              product.productCode, product.price, 'price', csvFieldMap, fieldToggleState
            );
            const priceExNum = Number(priceExStr) || 0;

            // 税込価格: CSV税抜が有効なら再計算、そうでなければSmaregi値から計算
            const taxIncluded = calcTaxIncludedPrice(priceExNum, product.taxRate);

            // 説明の解決
            const { value: descValue, isFromCsv: descIsFromCsv } = resolveDisplayValue(
              product.productCode, product.description, 'description', csvFieldMap, fieldToggleState
            );

            return (
              <tr
                key={product.productId}
                className={`${rowClass} hover:bg-primary/5 cursor-pointer transition-colors`}
                onClick={() => onToggleSelect(product.productId)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(product.productId)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.productCode}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-text-dark">{product.productName}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.categoryName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {product.maker || product.tag || '-'}
                </td>
                {/* 説明セル */}
                <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                  <div className="flex items-center gap-1">
                    <span className="line-clamp-1">{descValue || '-'}</span>
                    {descIsFromCsv && (
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0 rounded font-medium text-blue-700 bg-blue-50 whitespace-nowrap flex-shrink-0">
                        CSV
                      </span>
                    )}
                  </div>
                </td>
                {/* 税抜価格セル */}
                <td className="px-4 py-3 text-sm font-medium text-right text-text-dark">
                  <div className="flex items-center justify-end gap-1">
                    {priceIsFromCsv && (
                      <span className="inline-flex items-center text-[10px] px-1.5 py-0 rounded font-medium text-blue-700 bg-blue-50 whitespace-nowrap flex-shrink-0">
                        CSV
                      </span>
                    )}
                    <span>{formatPrice(priceExNum)}</span>
                  </div>
                </td>
                {/* 税込価格セル */}
                <td className="px-4 py-3 text-sm font-medium text-right text-text-dark">
                  {formatPrice(taxIncluded)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
