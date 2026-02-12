'use client';

import { useState, useEffect, useRef } from 'react';
import { SaveType } from '@/types/project';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, saveType: SaveType, overwriteId?: string) => void;
  defaultName?: string;
  isLoading?: boolean;
  isOverwrite?: boolean;
  isSaving?: boolean;
  /** 上書き時は保存タイプ変更不可 */
  currentSaveType?: SaveType;
  productCount?: number;
  /** 同名プロジェクトの検索（上書き確認用） */
  onFindDuplicate?: (name: string, saveType: SaveType) => Promise<{ id: string; name: string } | null>;
}

/**
 * 保存モーダル（タイプ選択＋タイトル入力＋同名上書き確認）
 */
export function SaveModal({
  isOpen,
  onClose,
  onSave,
  defaultName = '',
  isLoading = false,
  isOverwrite = false,
  isSaving = false,
  currentSaveType,
  productCount = 0,
  onFindDuplicate,
}: SaveModalProps) {
  const [name, setName] = useState(defaultName);
  const [saveType, setSaveType] = useState<SaveType>(currentSaveType || 'project');
  const [error, setError] = useState('');
  const [overwriteConfirm, setOverwriteConfirm] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loading = isLoading || isSaving;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setName(defaultName);
      setOverwriteConfirm(null);
      if (currentSaveType) setSaveType(currentSaveType);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName, currentSaveType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (overwriteConfirm) {
          setOverwriteConfirm(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, overwriteConfirm]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    if (name.length > 50) {
      setError('名前は50文字以内で入力してください');
      return;
    }
    setError('');

    // 同名チェック（新規保存時のみ）
    if (!isOverwrite && onFindDuplicate) {
      const duplicate = await onFindDuplicate(name.trim(), saveType);
      if (duplicate) {
        setOverwriteConfirm(duplicate);
        return;
      }
    }

    console.log('[SaveModal] ★ onSave called:', { name: name.trim(), saveType });
    onSave(name.trim(), saveType);
  };

  const handleOverwriteConfirm = () => {
    if (!overwriteConfirm) return;
    console.log('[SaveModal] ★ overwrite confirmed:', { name: name.trim(), saveType, overwriteId: overwriteConfirm.id });
    onSave(name.trim(), saveType, overwriteConfirm.id);
    setOverwriteConfirm(null);
  };

  const canSelectType = !isOverwrite;

  // 上書き確認ポップアップ
  if (overwriteConfirm) {
    const typeLabel = saveType === 'template' ? 'テンプレート' : 'プロジェクト';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setOverwriteConfirm(null)} />
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              同じ名前の{typeLabel}があります
            </h3>
            <p className="text-gray-600 mb-1">
              「{overwriteConfirm.name}」はすでに存在します。
            </p>
            <p className="text-sm text-gray-500 mb-6">
              上書きすると既存のデータは置き換えられます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setOverwriteConfirm(null)}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleOverwriteConfirm}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    保存中...
                  </>
                ) : (
                  '上書き保存'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            {isOverwrite ? '上書き保存' : 'データを保存'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 保存タイプ選択 */}
          {canSelectType && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">保存タイプ</label>
              <div className="grid grid-cols-2 gap-3">
                {/* テンプレート保存 */}
                <button
                  type="button"
                  onClick={() => setSaveType('template')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    saveType === 'template'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {saveType === 'template' && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    saveType === 'template' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <p className={`text-sm font-bold ${saveType === 'template' ? 'text-purple-700' : 'text-gray-700'}`}>
                    テンプレート保存
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    デザインのみ保存。<br />他の商品にも使い回せます
                  </p>
                </button>

                {/* プロジェクト保存 */}
                <button
                  type="button"
                  onClick={() => setSaveType('project')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    saveType === 'project'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {saveType === 'project' && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    saveType === 'project' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <p className={`text-sm font-bold ${saveType === 'project' ? 'text-green-700' : 'text-gray-700'}`}>
                    プロジェクト保存
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    デザイン＋商品({productCount}件)<br />をセットで保存
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 上書き時のタイプ表示 */}
          {!canSelectType && currentSaveType && (
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                currentSaveType === 'template'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {currentSaveType === 'template' ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                    </svg>
                    テンプレート
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                    </svg>
                    プロジェクト
                  </>
                )}
              </span>
            </div>
          )}

          {/* 名前入力 */}
          <div className="mb-5">
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
              {saveType === 'template' ? 'テンプレート名' : 'プロジェクト名'}
            </label>
            <input
              ref={inputRef}
              type="text"
              id="project-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder={saveType === 'template' ? '例: セール用デザイン' : '例: 2月セールPOP'}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              disabled={loading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-gray-500">
              {saveType === 'template'
                ? 'デザインだけを保存します。メインページの「保存データから選ぶ」から呼び出せます'
                : 'デザインと選択した商品データをまとめて保存します'}
            </p>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 px-4 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                saveType === 'template'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  保存中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isOverwrite ? '上書き保存' : '保存'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SaveModal;
