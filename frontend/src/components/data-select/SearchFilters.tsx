'use client';

import { useState } from 'react';
import { Category } from '@/types/product';

interface SearchFiltersProps {
  categories: Category[];
  onSearch: (keyword: string, categoryId: string) => void;
  isLoading: boolean;
}

export default function SearchFilters({ categories, onSearch, isLoading }: SearchFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSearch = () => {
    onSearch(keyword, categoryId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setKeyword('');
    setCategoryId('');
    onSearch('', '');
  };

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex flex-wrap gap-4">
        {/* キーワード検索 */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            キーワード検索
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="商品名、商品コードで検索..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* カテゴリ選択 */}
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            カテゴリ
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">すべて</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* ボタン */}
        <div className="flex items-end gap-2">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                検索中
              </span>
            ) : (
              '検索'
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
    </div>
  );
}
