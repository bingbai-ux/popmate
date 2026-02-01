'use client';

import { useState, useRef, useEffect } from 'react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const selectedLabels = options.filter(o => selectedValues.includes(o.value)).map(o => o.label);

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {/* 3行表示のボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary flex items-start justify-between min-h-[72px]"
      >
        <span className={`flex-1 ${selectedLabels.length ? 'text-text-dark' : 'text-gray-400'} line-clamp-3 leading-5`}>
          {selectedLabels.length > 0
            ? selectedLabels.join(', ')
            : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          <button type="button" onClick={handleSelectAll} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-border flex items-center gap-2">
            <input type="checkbox" checked={selectedValues.length === options.length} readOnly className="w-4 h-4 rounded border-gray-300 text-primary" />
            <span className="font-medium">{selectedValues.length === options.length ? 'すべて解除' : 'すべて選択'}</span>
          </button>
          {options.map((option) => (
            <button key={option.value} type="button" onClick={() => handleToggle(option.value)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
              <input type="checkbox" checked={selectedValues.includes(option.value)} readOnly className="w-4 h-4 rounded border-gray-300 text-primary" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
