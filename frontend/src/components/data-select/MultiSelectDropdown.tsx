'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = '選択してください',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ドロップダウンが開いたら検索欄にフォーカス
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    const filteredOptions = filteredOptionsList;
    const filteredValues = filteredOptions.map(o => o.value);
    const allSelected = filteredValues.every(v => selectedValues.includes(v));
    
    if (allSelected) {
      // フィルタされた項目をすべて解除
      onChange(selectedValues.filter(v => !filteredValues.includes(v)));
    } else {
      // フィルタされた項目をすべて選択（既存の選択は維持）
      const newValues = [...new Set([...selectedValues, ...filteredValues])];
      onChange(newValues);
    }
  };

  // 検索でフィルタリング
  const filteredOptionsList = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  const selectedLabels = options.filter(o => selectedValues.includes(o.value)).map(o => o.label);

  // フィルタされた項目がすべて選択されているか
  const allFilteredSelected = filteredOptionsList.length > 0 && 
    filteredOptionsList.every(o => selectedValues.includes(o.value));

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex items-center justify-between"
      >
        <span className={`truncate ${selectedLabels.length ? 'text-text-dark' : 'text-gray-400'}`}>
          {selectedLabels.length > 0
            ? selectedLabels.length > 2
              ? `${selectedLabels.slice(0, 2).join(', ')} 他${selectedLabels.length - 2}件`
              : selectedLabels.join(', ')
            : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/20">
          <div className="bg-white border border-border rounded-lg shadow-xl w-[800px] max-w-[90vw] max-h-[70vh] flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-medium text-sm">{label}を選択</span>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setSearchQuery(''); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 検索欄 */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${label}を検索...`}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* すべて選択ボタン */}
            <div className="px-3 py-2 border-b border-border bg-gray-50">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  readOnly
                  className="w-4 h-4 rounded border-gray-300 text-primary"
                />
                <span className="font-medium">
                  {allFilteredSelected ? 'すべて解除' : 'すべて選択'}
                  {searchQuery && ` (${filteredOptionsList.length}件)`}
                </span>
              </button>
            </div>

            {/* オプション一覧（3列グリッド） */}
            <div className="flex-1 overflow-auto p-3">
              {filteredOptionsList.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  該当する項目がありません
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {filteredOptionsList.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      className="px-3 py-2 text-left text-sm hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        readOnly
                        className="w-4 h-4 rounded border-gray-300 text-primary flex-shrink-0"
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="flex items-center justify-between p-3 border-t border-border bg-gray-50">
              <span className="text-sm text-gray-500">
                {selectedValues.length}件選択中
              </span>
              <button
                type="button"
                onClick={() => { setIsOpen(false); setSearchQuery(''); }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
