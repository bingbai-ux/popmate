'use client';

import { useState, useRef, useEffect } from 'react';
import { FONTS, FontOption } from '@/lib/fonts';

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  fontCategory: 'all' | 'japanese' | 'english';
}

export default function FontSelector({ value, onChange, fontCategory }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // フォントのフィルタリング
  const filteredFonts = FONTS.filter(font => {
    const matchesCategory = fontCategory === 'all' || font.category === fontCategory;
    const matchesSearch = searchQuery === '' ||
      font.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      font.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 現在選択されているフォント
  const selectedFont = FONTS.find(f => f.value === value);

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ドロップダウンを開いたときに検索入力にフォーカス
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (font: FontOption) => {
    onChange(font.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 選択ボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-left flex items-center justify-between hover:border-primary transition-colors bg-white"
        style={{ fontFamily: value }}
      >
        <span className="truncate">{selectedFont?.label || value}</span>
        <svg
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          {/* 検索入力 */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="フォントを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* フォントリスト */}
          <div className="max-h-64 overflow-y-auto">
            {filteredFonts.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                フォントが見つかりません
              </div>
            ) : (
              filteredFonts.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => handleSelect(font)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    font.value === value ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className="text-base truncate"
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </span>
                  {font.value === value && (
                    <svg className="w-4 h-4 text-primary flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
