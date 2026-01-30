'use client';

import type { Template } from '@/types';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}

const templateTypeLabels: Record<string, string> = {
  price_pop: 'プライスポップ',
  a4_pop: 'A4ポップ',
  a5_pop: 'A5ポップ',
  a6_pop: 'A6ポップ',
  custom: 'カスタム',
};

export default function TemplateCard({
  template,
  isSelected,
  onClick,
}: TemplateCardProps) {
  return (
    <div
      onClick={onClick}
      className={`template-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="aspect-[3/4] bg-gray-100 rounded mb-3 flex items-center justify-center">
        <div
          className="bg-white border border-gray-300 shadow-sm"
          style={{
            width: `${Math.min(template.width_mm * 1.5, 120)}px`,
            height: `${Math.min(template.height_mm * 1.5, 160)}px`,
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            {template.width_mm}×{template.height_mm}mm
          </div>
        </div>
      </div>
      <h3 className="font-medium text-sm mb-1">{template.name}</h3>
      <p className="text-xs text-gray-500">
        {templateTypeLabels[template.type] || template.type}
      </p>
      {template.is_system && (
        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
          システム
        </span>
      )}
    </div>
  );
}
