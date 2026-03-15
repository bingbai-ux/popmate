'use client';

import { useState, useRef, useCallback } from 'react';

export interface BulkSearchProduct {
  productId: string;
  productCode: string;
  productName: string;
}

interface CsvJancodeImportProps {
  onImportComplete: (products: BulkSearchProduct[]) => void;
  disabled?: boolean;
}

interface ImportResult {
  foundCount: number;
  notFoundCodes: string[];
}

/**
 * CSV取込によるJANCODE一括選択コンポーネント
 */
export default function CsvJancodeImport({ onImportComplete, disabled }: CsvJancodeImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

  const handleButtonClick = () => {
    setResult(null);
    setError(null);
    fileInputRef.current?.click();
  };

  const detectAndDecodeText = useCallback((buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    // Shift-JIS判定: 0x80以上のバイトがあり、UTF-8として不正な場合
    let isUtf8 = true;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 0x80) {
        // UTF-8マルチバイトシーケンスの検証
        if (bytes[i] >= 0xC0 && bytes[i] < 0xE0) {
          if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) {
            isUtf8 = false; break;
          }
          i += 1;
        } else if (bytes[i] >= 0xE0 && bytes[i] < 0xF0) {
          if (i + 2 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80 || (bytes[i + 2] & 0xC0) !== 0x80) {
            isUtf8 = false; break;
          }
          i += 2;
        } else if (bytes[i] < 0xC0) {
          isUtf8 = false; break;
        }
      }
    }

    if (isUtf8) {
      return new TextDecoder('utf-8').decode(buffer);
    }
    return new TextDecoder('shift-jis').decode(buffer);
  }, []);

  const parseJancodesFromCsv = useCallback((text: string): string[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // ヘッダ判定: 1行目に "jancode" or "商品コード" があるか
    const firstLine = lines[0].toLowerCase();
    const columns = lines[0].split(',').map(c => c.trim().toLowerCase());
    let jancodeColIndex = 0;
    let startRow = 0;

    const headerKeywords = ['jancode', '商品コード', 'productcode', 'jan'];
    const hasHeader = columns.some(col =>
      headerKeywords.some(kw => col.includes(kw))
    );

    if (hasHeader) {
      jancodeColIndex = columns.findIndex(col =>
        headerKeywords.some(kw => col.includes(kw))
      );
      startRow = 1;
    } else if (firstLine.includes(',') && !/^\d+$/.test(columns[0])) {
      // ヘッダっぽいが認識できない場合、1列目を使う
      startRow = 1;
    }

    const jancodes: string[] = [];
    for (let i = startRow; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const value = (cols[jancodeColIndex] || '').trim()
        .replace(/^["']|["']$/g, ''); // クォート除去
      if (value && /^\d+$/.test(value)) {
        jancodes.push(value);
      }
    }
    return jancodes;
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // inputリセット（同じファイルを再選択可能にする）
    e.target.value = '';

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // ファイル読み込み
      const buffer = await file.arrayBuffer();
      const text = detectAndDecodeText(buffer);
      const jancodes = parseJancodesFromCsv(text);

      if (jancodes.length === 0) {
        setError('CSVにJANCODEが含まれていません');
        setIsLoading(false);
        return;
      }

      setTotalCount(jancodes.length);

      // API呼び出し
      const res = await fetch(`${API_BASE}/api/smaregi/products/bulk-search-by-jancode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jancodes }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const data = json.data || json;

      if (!data.found || data.found.length === 0) {
        setError('一致する商品が見つかりませんでした');
        setIsLoading(false);
        return;
      }

      onImportComplete(data.found as BulkSearchProduct[]);

      setResult({
        foundCount: data.found.length,
        notFoundCodes: data.notFound || [],
      });
    } catch (err: any) {
      console.log('=== CsvJancodeImport error ===', { err });
      setError('商品の検索に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, detectAndDecodeText, parseJancodesFromCsv, onImportComplete]);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>検索中... ({totalCount}件)</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>CSVで一括選択</span>
          </>
        )}
      </button>

      {/* 成功メッセージ */}
      {result && (
        <div className="text-sm">
          <p className="text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded">
            {result.foundCount}件選択しました
            {result.notFoundCodes.length > 0 && (
              <span className="text-orange-600">
                （{result.notFoundCodes.length}件は見つかりませんでした）
              </span>
            )}
          </p>

          {result.notFoundCodes.length > 0 && (
            <div className="mt-1">
              <button
                onClick={() => setShowNotFound(!showNotFound)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showNotFound ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                見つからなかったJANCODE一覧
              </button>
              {showNotFound && (
                <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
                  {result.notFoundCodes.map((code, i) => (
                    <div key={i}>{code}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
