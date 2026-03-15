'use client';

import { useState, useMemo } from 'react';
import { MergedProduct, FieldToggleState, getFieldLabel } from '@/types/csvFieldToggle';

interface CsvPreviewModalProps {
  isOpen: boolean;
  mergedProducts: MergedProduct[];
  notFoundJancodes: string[];
  initialToggleState: FieldToggleState;
  onConfirm: (productIds: string[], toggleState: FieldToggleState) => void;
  onClose: () => void;
}

export default function CsvPreviewModal({
  isOpen,
  mergedProducts,
  notFoundJancodes,
  initialToggleState,
  onConfirm,
  onClose,
}: CsvPreviewModalProps) {
  const [toggleState, setToggleState] = useState<FieldToggleState>(initialToggleState);
  const [showNotFound, setShowNotFound] = useState(false);

  // initialToggleStateが変わったらリセット
  useState(() => {
    setToggleState(initialToggleState);
  });

  // CSV追加フィールド名一覧を抽出
  const csvFieldNames = useMemo(() => {
    const allFields = mergedProducts.flatMap(p => Object.keys(p.csvFields));
    return [...new Set(allFields)];
  }, [mergedProducts]);

  // トグル切り替え
  const handleToggle = (fieldName: string, useCSV: boolean) => {
    setToggleState(prev => ({ ...prev, [fieldName]: useCSV }));
  };

  // 表示値を決定
  const getDisplayValue = (product: MergedProduct, fieldName: string): string => {
    const useCsv = toggleState[fieldName];
    const csvVal = product.csvFields[fieldName];
    const smaregiVal = (product.smaregiFields as any)[fieldName] ?? null;

    if (useCsv && csvVal != null && csvVal !== '') return csvVal;
    return smaregiVal ?? '';
  };

  // 価格フォーマット
  const formatPrice = (val: string): string => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(num);
  };

  const handleConfirm = () => {
    onConfirm(mergedProducts.map(p => p.productId), toggleState);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">CSV取込プレビュー</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {mergedProducts.length}件見つかりました
              {notFoundJancodes.length > 0 && (
                <span className="text-orange-600">
                  {' '}/ {notFoundJancodes.length}件は見つかりませんでした
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* フィールド切り替えトグル */}
        {csvFieldNames.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">フィールド切り替え:</p>
            <div className="flex flex-wrap gap-3">
              {csvFieldNames.map(fieldName => (
                <div key={fieldName} className="flex items-center gap-1 text-sm">
                  <span className="text-gray-600 font-medium mr-1">{getFieldLabel(fieldName)}</span>
                  <button
                    onClick={() => handleToggle(fieldName, true)}
                    className={`px-2.5 py-1 rounded-l-md text-xs font-medium border transition-colors ${
                      toggleState[fieldName]
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleToggle(fieldName, false)}
                    className={`px-2.5 py-1 rounded-r-md text-xs font-medium border border-l-0 transition-colors ${
                      !toggleState[fieldName]
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Smaregi
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* テーブル */}
        <div className="flex-1 overflow-auto px-6 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-2 text-left font-medium text-gray-500">JANCODE</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">商品名</th>
                {csvFieldNames.map(fieldName => (
                  <th key={fieldName} className="px-3 py-2 text-left font-medium text-gray-500">
                    {getFieldLabel(fieldName)}
                    {toggleState[fieldName] && (
                      <span className="ml-1 text-blue-500 text-xs">CSV</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mergedProducts.map((product, idx) => (
                <tr
                  key={product.productId}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-3 py-2 text-gray-600 font-mono text-xs">
                    {product.productCode}
                  </td>
                  <td className="px-3 py-2 text-gray-800">
                    {product.productName}
                  </td>
                  {csvFieldNames.map(fieldName => {
                    const csvVal = product.csvFields[fieldName] ?? '';
                    const smaregiVal = (product.smaregiFields as any)[fieldName] ?? '';
                    const useCsv = toggleState[fieldName];
                    const displayVal = getDisplayValue(product, fieldName);
                    const isSame = csvVal === String(smaregiVal);
                    const isPrice = fieldName === 'price';

                    return (
                      <td key={fieldName} className="px-3 py-2">
                        <div>
                          <span className={`font-medium ${isSame ? 'text-gray-400' : 'text-gray-800'}`}>
                            {isPrice ? formatPrice(displayVal) : displayVal || '-'}
                          </span>
                          {!isSame && csvVal && smaregiVal && (
                            <span className="block text-xs text-gray-400 mt-0.5">
                              ({useCsv ? 'Smaregi' : 'CSV'}:{' '}
                              {isPrice ? formatPrice(String(useCsv ? smaregiVal : csvVal)) : (useCsv ? smaregiVal : csvVal)})
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 見つからなかったJANCODE */}
        {notFoundJancodes.length > 0 && (
          <div className="px-6 py-2 border-t border-gray-200">
            <button
              onClick={() => setShowNotFound(!showNotFound)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showNotFound ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              見つからなかったJANCODE ({notFoundJancodes.length}件)
            </button>
            {showNotFound && (
              <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 max-h-24 overflow-y-auto">
                {notFoundJancodes.map((code, i) => <div key={i}>{code}</div>)}
              </div>
            )}
          </div>
        )}

        {/* フッターボタン */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            この内容で選択する
          </button>
        </div>
      </div>
    </div>
  );
}
