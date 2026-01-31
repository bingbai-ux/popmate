'use client';

import { PLACEHOLDERS } from '@/types/editor';

interface PlaceholderMenuProps {
  onSelect: (placeholder: string) => void;
  onClose: () => void;
}

export default function PlaceholderMenu({ onSelect, onClose }: PlaceholderMenuProps) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
      <div className="p-2 border-b border-border">
        <span className="text-xs text-gray-500 font-medium">プレースホルダーを挿入</span>
      </div>
      <div className="py-1">
        {PLACEHOLDERS.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key);
              onClose();
            }}
            className="w-full px-3 py-2 text-left hover:bg-primary/5 transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-gray-700">{item.label}</span>
            <code className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
              {item.key}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}
