'use client';

import { TaxSettings as TaxSettingsType } from '@/types/editor';

interface TaxSettingsProps {
  settings: TaxSettingsType;
  onChange: (settings: TaxSettingsType) => void;
}

export default function TaxSettings({ settings, onChange }: TaxSettingsProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <h3 className="font-bold text-sm text-text-dark mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        税込価格設定
      </h3>

      {/* 税率 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">税率</label>
        <div className="flex gap-2">
          {[
            { value: 8, label: '8%（軽減税率）' },
            { value: 10, label: '10%（標準税率）' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ ...settings, taxRate: option.value })}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                settings.taxRate === option.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 端数処理 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">端数処理</label>
        <div className="space-y-2">
          {[
            { value: 'floor', label: '切り捨て' },
            { value: 'round', label: '四捨五入' },
            { value: 'ceil', label: '切り上げ' },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                settings.roundingMode === option.value ? 'bg-primary/5' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="roundingMode"
                value={option.value}
                checked={settings.roundingMode === option.value}
                onChange={(e) => onChange({ ...settings, roundingMode: e.target.value as 'round' | 'floor' | 'ceil' })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="text-sm flex-1">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 計算例 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">計算例（税抜 ¥1,000）</p>
        <p className="text-sm font-bold text-primary">
          税込: ¥{(() => {
            const raw = 1000 * (1 + settings.taxRate / 100);
            if (settings.roundingMode === 'round') return Math.round(raw).toLocaleString();
            if (settings.roundingMode === 'ceil') return Math.ceil(raw).toLocaleString();
            return Math.floor(raw).toLocaleString();
          })()}
        </p>
      </div>
    </div>
  );
}
