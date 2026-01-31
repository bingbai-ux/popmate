'use client';

import { useState } from 'react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PdfExportSettings) => void;
  itemCount: number;
  isExporting?: boolean;
}

export interface PdfExportSettings {
  mode: 'single' | 'multiple' | 'actual';
  pageSize: 'a4' | 'a3' | 'letter';
  orientation: 'portrait' | 'landscape';
  columns: number;
  rows: number;
  margin: number;
  gap: number;
}

export default function PdfExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  itemCount,
  isExporting = false 
}: PdfExportModalProps) {
  const [settings, setSettings] = useState<PdfExportSettings>({
    mode: 'single',
    pageSize: 'a4',
    orientation: 'portrait',
    columns: 2,
    rows: 2,
    margin: 10,
    gap: 5,
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark">PDF出力</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isExporting}
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 出力モード */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-3">出力モード</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSettings(s => ({ ...s, mode: 'single' }))}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  settings.mode === 'single' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border hover:border-gray-300'
                }`}
                disabled={isExporting}
              >
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium">1枚ずつ</span>
                </div>
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, mode: 'multiple' }))}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  settings.mode === 'multiple' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border hover:border-gray-300'
                }`}
                disabled={isExporting}
              >
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="text-xs font-medium">面付け</span>
                </div>
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, mode: 'actual' }))}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  settings.mode === 'actual' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border hover:border-gray-300'
                }`}
                disabled={isExporting}
              >
                <div className="text-center">
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="text-xs font-medium">実寸</span>
                </div>
              </button>
            </div>
          </div>

          {/* 用紙サイズ（面付けモード以外） */}
          {settings.mode !== 'actual' && (
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">用紙サイズ</label>
              <select
                value={settings.pageSize}
                onChange={(e) => setSettings(s => ({ ...s, pageSize: e.target.value as 'a4' | 'a3' | 'letter' }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isExporting}
              >
                <option value="a4">A4</option>
                <option value="a3">A3</option>
                <option value="letter">レター</option>
              </select>
            </div>
          )}

          {/* 用紙の向き（面付けモード以外） */}
          {settings.mode !== 'actual' && (
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">用紙の向き</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettings(s => ({ ...s, orientation: 'portrait' }))}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${
                    settings.orientation === 'portrait'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-gray-300'
                  }`}
                  disabled={isExporting}
                >
                  縦向き
                </button>
                <button
                  onClick={() => setSettings(s => ({ ...s, orientation: 'landscape' }))}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 transition-colors ${
                    settings.orientation === 'landscape'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-gray-300'
                  }`}
                  disabled={isExporting}
                >
                  横向き
                </button>
              </div>
            </div>
          )}

          {/* 面付け設定 */}
          {settings.mode === 'multiple' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">列数</label>
                <select
                  value={settings.columns}
                  onChange={(e) => setSettings(s => ({ ...s, columns: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isExporting}
                >
                  {[1, 2, 3, 4].map(n => (
                    <option key={n} value={n}>{n}列</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">行数</label>
                <select
                  value={settings.rows}
                  onChange={(e) => setSettings(s => ({ ...s, rows: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={isExporting}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}行</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 出力情報 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {settings.mode === 'single' && `${itemCount}枚のポップを${itemCount}ページのPDFとして出力します`}
                {settings.mode === 'multiple' && `${itemCount}枚のポップを${Math.ceil(itemCount / (settings.columns * settings.rows))}ページのPDFとして出力します（1ページ${settings.columns * settings.rows}枚）`}
                {settings.mode === 'actual' && `${itemCount}枚のポップを実寸サイズで出力します`}
              </span>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-text-dark font-medium rounded-xl hover:bg-gray-200 transition-colors"
            disabled={isExporting}
          >
            キャンセル
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                出力中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDFを出力
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
