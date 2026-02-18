'use client';

import { useState } from 'react';
import { Category } from '@/types/product';
import MultiSelectDropdown from './MultiSelectDropdown';

interface SearchFiltersProps {
  categories: Category[];
  makers: string[];       // メーカー(tag)一覧
  suppliers: string[];    // 仕入先(groupCode)一覧
  onSearch: (filters: SearchFiltersType) => void;
  isLoading: boolean;
  isFiltersLoading: boolean;  // フィルタ一覧読み込み中
  hasSearched: boolean;
}

export interface SearchFiltersType {
  keyword: string;
  categoryIds: string[];   // カテゴリID（複数選択）
  makerIds: string[];      // メーカー＝タグ値（複数選択）
  supplierIds: string[];   // 仕入先＝グループコード値（複数選択）
}

export default function SearchFilters({
  categories,
  makers,
  suppliers,
  onSearch,
  isLoading,
  isFiltersLoading,
  hasSearched,
}: SearchFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [makerIds, setMakerIds] = useState<string[]>([]);
  const [supplierIds, setSupplierIds] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch({ keyword, categoryIds, makerIds, supplierIds });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setKeyword('');
    setCategoryIds([]);
    setMakerIds([]);
    setSupplierIds([]);
  };

  // ドロップダウン用オプション
  const categoryOptions = categories.map(c => ({
    value: c.categoryId,
    label: c.categoryName,
  }));

  // メーカー（tag値をそのままvalueとlabelに）
  const makerOptions = makers.map(m => ({ value: m, label: m }));

  // 仕入先（groupCode値をそのままvalueとlabelに）
  const supplierOptions = suppliers.map(s => ({ value: s, label: s }));

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex flex-wrap gap-4">
        {/* キーワード */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">キーワード検索</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="商品名、メーカー、商品コード、価格で検索..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* カテゴリ */}
        <div className="w-48">
          <MultiSelectDropdown
            label="カテゴリ"
            options={categoryOptions}
            selectedValues={categoryIds}
            onChange={setCategoryIds}
            placeholder={isFiltersLoading ? '読込中...' : 'すべて'}
          />
        </div>

        {/* メーカー（= tag） */}
        <div className="w-48">
          <MultiSelectDropdown
            label="メーカー"
            options={makerOptions}
            selectedValues={makerIds}
            onChange={setMakerIds}
            placeholder={isFiltersLoading ? '読込中...' : 'すべて'}
          />
        </div>

        {/* 仕入先（= groupCode） */}
        <div className="w-48">
          <MultiSelectDropdown
            label="仕入先"
            options={supplierOptions}
            selectedValues={supplierIds}
            onChange={setSupplierIds}
            placeholder={isFiltersLoading ? '読込中...' : 'すべて'}
          />
        </div>

        {/* ボタン */}
        <div className="flex items-end gap-2">
          <button
            onClick={handleSearch}
            disabled={isLoading || isFiltersLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>検索中...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>検索</span>
              </>
            )}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-border text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>

      {/* フィルタ読み込み中の表示 */}
      {isFiltersLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>カテゴリ・メーカー・仕入先を読み込み中...</span>
        </div>
      )}

      {/* 検索前のヒント */}
      {!isFiltersLoading && !hasSearched && !isLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>条件を選択して「検索」ボタンを押すと商品が表示されます</span>
        </div>
      )}
    </div>
  );
}
