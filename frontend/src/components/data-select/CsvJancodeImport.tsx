'use client';

import { useState, useRef, useCallback } from 'react';
import { Product } from '@/types/product';
import {
  ParsedCsvRow,
  CsvFieldMap,
  JANCODE_COLUMN_ALIASES,
  normalizeFieldName,
} from '@/types/csvFieldToggle';

interface CsvJancodeImportProps {
  onImportComplete: (products: Product[], csvFieldMap: CsvFieldMap) => void;
  disabled?: boolean;
}

/** スマレジAPIレスポンスをProduct型に変換 */
function transformBulkProduct(p: any): Product {
  const reduceTaxId = p.reduceTaxId || null;
  // 税率選択式の警告
  if (['10000002', '10000003', '10000004'].includes(reduceTaxId ?? '')) {
    console.log('=== 税率選択式商品 ===', { productId: p.productId, reduceTaxId, '適用税率': '10%（安全側）' });
  }
  const taxRate = reduceTaxId === '10000001' ? 8 : 10;
  return {
    productId: String(p.productId || ''),
    productCode: String(p.productCode || ''),
    productName: String(p.productName || ''),
    price: Number(p.price) || 0,
    categoryId: String(p.categoryId || ''),
    categoryName: String(p.categoryName || ''),
    groupCode: String(p.groupCode || ''),
    description: String(p.description || ''),
    tag: String(p.tag || ''),
    maker: String(p.tag || ''),
    taxDivision: (String(p.taxDivision || '1') as '0' | '1' | '2'),
    taxRate,
  };
}

interface ImportResult {
  foundCount: number;
  notFoundCodes: string[];
}

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
    let isUtf8 = true;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 0x80) {
        if (bytes[i] >= 0xC0 && bytes[i] < 0xE0) {
          if (i + 1 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80) { isUtf8 = false; break; }
          i += 1;
        } else if (bytes[i] >= 0xE0 && bytes[i] < 0xF0) {
          if (i + 2 >= bytes.length || (bytes[i + 1] & 0xC0) !== 0x80 || (bytes[i + 2] & 0xC0) !== 0x80) { isUtf8 = false; break; }
          i += 2;
        } else if (bytes[i] < 0xC0) {
          isUtf8 = false; break;
        }
      }
    }
    return isUtf8
      ? new TextDecoder('utf-8').decode(buffer)
      : new TextDecoder('shift-jis').decode(buffer);
  }, []);

  /** CSV拡張パーサー: JANCODEと追加フィールドを返す（CSV/TSV自動判定） */
  const parseCsvRows = useCallback((text: string): ParsedCsvRow[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // デリミタ自動検出: タブが含まれていればTSV、なければCSV
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    console.log('=== CSV Delimiter ===', delimiter === '\t' ? 'TAB (TSV)' : 'COMMA (CSV)');

    const splitLine = (line: string) =>
      line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

    const rawColumns = splitLine(firstLine);
    const lowerColumns = rawColumns.map(c => c.toLowerCase());
    let jancodeColIndex = 0;
    let startRow = 0;
    let headerNames: string[] = [];

    const hasHeader = lowerColumns.some(col =>
      JANCODE_COLUMN_ALIASES.some(kw => col.includes(kw))
    );

    if (hasHeader) {
      jancodeColIndex = lowerColumns.findIndex(col =>
        JANCODE_COLUMN_ALIASES.some(kw => col.includes(kw))
      );
      startRow = 1;
      headerNames = rawColumns.map((name, i) =>
        i === jancodeColIndex ? '' : normalizeFieldName(name)
      );
      console.log('=== CSV Headers ===', {
        rawColumns,
        normalizedHeaders: headerNames,
        jancodeColIndex,
        delimiter: delimiter === '\t' ? 'TAB' : 'COMMA',
      });
    } else if (firstLine.includes(delimiter) && !/^\d+$/.test(lowerColumns[0])) {
      startRow = 1;
    }

    const rows: ParsedCsvRow[] = [];
    for (let i = startRow; i < lines.length; i++) {
      const cols = splitLine(lines[i]);
      const jancode = (cols[jancodeColIndex] || '').trim();
      if (!jancode || !/^\d+$/.test(jancode)) continue;

      const additionalFields: { [key: string]: string } = {};
      if (headerNames.length > 0) {
        headerNames.forEach((name, idx) => {
          if (name && idx !== jancodeColIndex && cols[idx]) {
            additionalFields[name] = cols[idx];
          }
        });
      }

      rows.push({ jancode, additionalFields });
    }
    return rows;
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const text = detectAndDecodeText(buffer);
      const csvRows = parseCsvRows(text);

      // デバッグ: CSVパース結果
      if (csvRows.length > 0) {
        const sampleFields = csvRows[0].additionalFields;
        console.log('=== CSV Parse Result ===', {
          totalRows: csvRows.length,
          sampleJancode: csvRows[0].jancode,
          additionalFieldKeys: Object.keys(sampleFields),
          sampleFields,
        });
      }

      if (csvRows.length === 0) {
        setError('CSVにJANCODEが含まれていません');
        setIsLoading(false);
        return;
      }

      const jancodes = csvRows.map(r => r.jancode);
      const csvFieldMap: CsvFieldMap = Object.fromEntries(
        csvRows.map(row => [row.jancode, row.additionalFields])
      );
      setTotalCount(jancodes.length);

      const res = await fetch(`${API_BASE}/api/smaregi/products/bulk-search-by-jancode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jancodes }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = json.data || json;

      if (!data.found || data.found.length === 0) {
        setError('一致する商品が見つかりませんでした');
        setIsLoading(false);
        return;
      }

      const products = (data.found as any[]).map(transformBulkProduct);
      const notFoundCodes: string[] = data.notFound || [];

      // 親に products と csvFieldMap を渡す（モーダルなし、即時選択）
      onImportComplete(products, csvFieldMap);

      setResult({ foundCount: products.length, notFoundCodes });
    } catch (err: any) {
      console.log('=== CsvJancodeImport error ===', { err });
      setError('商品の検索に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, detectAndDecodeText, parseCsvRows, onImportComplete]);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        ※ CSVには商品コード（JANCODE）を記載してください
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={handleButtonClick}
          disabled={disabled || isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-border text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>CSV取込中... ({totalCount}件)</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>CSV一括選択</span>
            </>
          )}
        </button>

        {result && (
          <span className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded whitespace-nowrap">
            {result.foundCount}件選択しました
            {result.notFoundCodes.length > 0 && (
              <span className="text-orange-600">（{result.notFoundCodes.length}件未検出）</span>
            )}
          </span>
        )}

        {error && (
          <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded whitespace-nowrap">
            {error}
          </span>
        )}
      </div>

      {result && result.notFoundCodes.length > 0 && (
        <div>
          <button
            onClick={() => setShowNotFound(!showNotFound)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className={`w-3 h-3 transition-transform ${showNotFound ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            見つからなかったJANCODE一覧
          </button>
          {showNotFound && (
            <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
              {result.notFoundCodes.map((code, i) => <div key={i}>{code}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
