'use client';

import { useState } from 'react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  defaultName?: string;
  isLoading?: boolean;
}

export default function SaveModal({ isOpen, onClose, onSave, defaultName = '', isLoading = false }: SaveModalProps) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('プロジェクト名を入力してください');
      return;
    }

    if (name.length > 50) {
      setError('プロジェクト名は50文字以内で入力してください');
      return;
    }

    setError('');
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark">プロジェクトを保存</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="project-name" className="block text-sm font-medium text-text-dark mb-2">
              プロジェクト名
            </label>
            <input
              type="text"
              id="project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="例: 春の新商品POP"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-text-dark font-medium rounded-xl hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  保存中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
