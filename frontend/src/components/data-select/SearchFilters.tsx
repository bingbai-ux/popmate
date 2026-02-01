'use client';

import { useState } from 'react';
import { Category, Supplier } from '@/types/product';
import MultiSelectDropdown from './MultiSelectDropdown';

interface SearchFiltersProps {
  categories: Category[];
  makers: string[];  // メーカーは商品のgroupCodeから抽出した文字列配列
  suppliers: Supplier[];  // 仕入先はスマレジAPIから取得したSupplier型配列
  onSearch: (filters: SearchFiltersType) => void;
  isLoading: boolean;
}

export interface SearchFiltersType {
  keyword: string;
  categoryIds: string[];  // カテゴリID（categoryId）
  makerIds: string[];     // メーカー（groupCode値）
  supplierIds: string[];  // 仕入先ID（supplierId）
}

export default function SearchFilters({
  categories,
  makers,
  suppliers,
  onSearch,
  isLoading,
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
    onSearch({ keyword: '', categoryIds: [], makerIds: [], supplierIds: [] });
  };

  // カテゴリオプション（categoryIdをvalueに、categoryNameをlabelに）
  const categoryOptions = categories.map(c => ({ 
    value: c.categoryId, 
    label: c.categoryName 
  }));

  // メーカーオプション（groupCode値をそのままvalueとlabelに）
  const makerOptions = makers.map(m => ({ 
    value: m, 
    label: m 
  }));

  // 仕入先オプション（supplierIdをvalueに、supplierNameをlabelに）
  const supplierOptions = suppliers.map(s => ({ 
    value: s.supplierId, 
    label: s.supplierName 
  }));

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">キーワード検索</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="商品名、商品コードで検索..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="w-48">
          <MultiSelectDropdown 
            label="カテゴリ" 
            options={categoryOptions} 
            selectedValues={categoryIds} 
            onChange={setCategoryIds} 
            placeholder="すべて" 
          />
        </div>

        <div className="w-48">
          <MultiSelectDropdown 
            label="メーカー" 
            options={makerOptions} 
            selectedValues={makerIds} 
            onChange={setMakerIds} 
            placeholder="すべて" 
          />
        </div>

        <div className="w-48">
          <MultiSelectDropdown 
            label="仕入れ先" 
            options={supplierOptions} 
            selectedValues={supplierIds} 
            onChange={setSupplierIds} 
            placeholder="すべて" 
          />
        </div>

        <div className="flex items-end gap-2">
          <button 
            onClick={handleSearch} 
            disabled={isLoading} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? '検索中...' : '検索'}
          </button>
          <button 
            onClick={handleClear} 
            className="px-4 py-2 border border-border text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>
    </div>
  );
}
