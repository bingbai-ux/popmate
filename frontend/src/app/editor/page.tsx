'use client';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import EditorToolbar from '@/components/editor/EditorToolbar';
import EditorCanvas from '@/components/editor/EditorCanvas';
import PropertyPanel from '@/components/editor/PropertyPanel';
import {
  EditorElement,
  TextElement,
  ImageElement,
  ShapeElement,
  LineElement,
  BarcodeElement,
  QRCodeElement,
  TemplateConfig,
  DEFAULT_TEXT_STYLE,
  DEFAULT_SHAPE_STYLE,
  DEFAULT_LINE_STYLE,
  DEFAULT_BARCODE_SETTINGS,
  DEFAULT_QRCODE_SETTINGS,
} from '@/types/editor';
import { getTemplateById } from '@/types/template';
import { saveEditorState, loadEditorState } from '@/lib/editorStorage';
import type { RoundingMethod } from '@/lib/api';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // テンプレート設定を取得
  const templateData = getTemplateById(templateId);
  const template: TemplateConfig = templateData
    ? { id: templateData.id, name: templateData.name, width: templateData.width, height: templateData.height }
    : { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 };

  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [roundingMethod, setRoundingMethod] = useState<RoundingMethod>('floor');
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedElement, setCopiedElement] = useState<EditorElement | null>(null);

  // Undo/Redo用の履歴管理
  const [history, setHistory] = useState<EditorElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  // 履歴に追加
  const pushHistory = useCallback((newElements: EditorElement[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory(prev => {
      // 現在位置より後の履歴を削除
      const newHistory = prev.slice(0, historyIndex + 1);
      // 新しい状態を追加（最大50件）
      newHistory.push(JSON.parse(JSON.stringify(newElements)));
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    isUndoRedoRef.current = true;
    const prevIndex = historyIndex - 1;
    setHistoryIndex(prevIndex);
    setElements(JSON.parse(JSON.stringify(history[prevIndex])));
    console.log('[editor] Undo実行');
  }, [canUndo, historyIndex, history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    isUndoRedoRef.current = true;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setElements(JSON.parse(JSON.stringify(history[nextIndex])));
    console.log('[editor] Redo実行');
  }, [canRedo, historyIndex, history]);

  // 初期化時に保存された状態を復元
  useEffect(() => {
    const savedState = loadEditorState(templateId);
    if (savedState) {
      const restoredElements = savedState.elements;
      setElements(restoredElements);
      setZoom(savedState.zoom);
      setRoundingMethod(savedState.roundingMethod);
      // 初期状態を履歴に追加
      setHistory([JSON.parse(JSON.stringify(restoredElements))]);
      setHistoryIndex(0);
      console.log('[editor] 保存された状態を復元しました');
    } else {
      // 空の初期状態を履歴に追加
      setHistory([[]]);
      setHistoryIndex(0);
    }
    setIsInitialized(true);
  }, [templateId]);

  // 状態が変更されたら保存（初期化後のみ）
  useEffect(() => {
    if (!isInitialized) return;
    
    saveEditorState({
      elements,
      templateId,
      zoom,
      roundingMethod,
    });
  }, [elements, templateId, zoom, roundingMethod, isInitialized]);

  // 要素変更時に履歴を更新（デバウンス付き）
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isInitialized || isUndoRedoRef.current) return;
    
    // デバウンス: 連続した変更を1つの履歴としてまとめる
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }
    historyTimeoutRef.current = setTimeout(() => {
      pushHistory(elements);
    }, 500);

    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [elements, isInitialized, pushHistory]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // テキスト入力中（input, textarea にフォーカス）の場合はスキップ
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // ============ Undo (Ctrl/Cmd + Z) ============
      if (isCtrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // ============ Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y) ============
      if ((isCtrlOrCmd && e.key === 'z' && e.shiftKey) || (isCtrlOrCmd && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // ============ 矢印キー移動 ============
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElementId) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1; // Shift押下で1mm移動、通常は0.1mm

        setElements(prev => prev.map(el => {
          if (el.id !== selectedElementId) return el;
          const newPosition = { ...el.position };
          switch (e.key) {
            case 'ArrowUp':    newPosition.y = Math.max(0, el.position.y - step); break;
            case 'ArrowDown':  newPosition.y = el.position.y + step; break;
            case 'ArrowLeft':  newPosition.x = Math.max(0, el.position.x - step); break;
            case 'ArrowRight': newPosition.x = el.position.x + step; break;
          }
          return { ...el, position: newPosition };
        }));
      }

      // ============ コピー (Ctrl/Cmd + C) ============
      if (isCtrlOrCmd && e.key === 'c' && selectedElementId) {
        e.preventDefault();
        const elementToCopy = elements.find(el => el.id === selectedElementId);
        if (elementToCopy) {
          setCopiedElement(JSON.parse(JSON.stringify(elementToCopy)));
          console.log('[editor] 要素をコピーしました');
        }
      }

      // ============ ペースト (Ctrl/Cmd + V) ============
      if (isCtrlOrCmd && e.key === 'v' && copiedElement) {
        e.preventDefault();
        const newElement = {
          ...copiedElement,
          id: `${copiedElement.type}-${Date.now()}`, // 新しいIDを付与
          position: {
            x: copiedElement.position.x + 2, // 少しずらして配置
            y: copiedElement.position.y + 2,
          },
          zIndex: elements.length + 1,
        };
        setElements(prev => [...prev, newElement as EditorElement]);
        setSelectedElementId(newElement.id);
        console.log('[editor] 要素をペーストしました');
      }

      // ============ 削除 (Delete / Backspace) ============
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        setElements(prev => prev.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
      }

      // ============ 全選択解除 (Escape) ============
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, copiedElement, handleUndo, handleRedo]);

  // 要素追加のヘルパー
  const addElement = useCallback((element: EditorElement) => {
    setElements((prev) => [...prev, element]);
    setSelectedElementId(element.id);
  }, []);

  // テキスト追加
  const handleAddText = useCallback(() => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: { x: 10, y: 10 },
      size: { width: 50, height: 15 },
      rotation: 0,
      zIndex: elements.length + 1,
      content: '',  // ★ 空文字列（「テキスト」を入れない）
      style: { ...DEFAULT_TEXT_STYLE },
    };
    addElement(newElement);
  }, [elements.length, addElement]);

  // 画像追加
  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newElement: ImageElement = {
            id: `image-${Date.now()}`,
            type: 'image',
            position: { x: 10, y: 10 },
            size: { width: 30, height: 30 },
            rotation: 0,
            zIndex: elements.length + 1,
            src: event.target?.result as string,
            alt: file.name,
            opacity: 100,
          };
          addElement(newElement);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [elements.length, addElement]);

  // 図形追加
  const handleAddShape = useCallback((shapeType: string) => {
    const newElement: ShapeElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      position: { x: 10, y: 10 },
      size: { width: 30, height: 30 },
      rotation: 0,
      zIndex: elements.length + 1,
      shapeType: shapeType as ShapeElement['shapeType'],
      style: { ...DEFAULT_SHAPE_STYLE },
    };
    addElement(newElement);
  }, [elements.length, addElement]);

  // 線追加
  const handleAddLine = useCallback((lineType: string) => {
    const newElement: LineElement = {
      id: `line-${Date.now()}`,
      type: 'line',
      position: { x: 10, y: 10 },
      size: { width: 50, height: 30 },
      rotation: 0,
      zIndex: elements.length + 1,
      lineType: lineType as LineElement['lineType'],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 50, y: 30 },
      style: {
        ...DEFAULT_LINE_STYLE,
        endArrow: lineType === 'arrow',
      },
    };
    addElement(newElement);
  }, [elements.length, addElement]);

  // バーコード追加
  const handleAddBarcode = useCallback(() => {
    const newElement: BarcodeElement = {
      id: `barcode-${Date.now()}`,
      type: 'barcode',
      position: { x: 10, y: 10 },
      size: { width: 40, height: 20 },
      rotation: 0,
      zIndex: elements.length + 1,
      settings: { ...DEFAULT_BARCODE_SETTINGS },
    };
    addElement(newElement);
  }, [elements.length, addElement]);

  // QRコード追加
  const handleAddQRCode = useCallback(() => {
    const newElement: QRCodeElement = {
      id: `qrcode-${Date.now()}`,
      type: 'qrcode',
      position: { x: 10, y: 10 },
      size: { width: 25, height: 25 },
      rotation: 0,
      zIndex: elements.length + 1,
      settings: { ...DEFAULT_QRCODE_SETTINGS },
    };
    addElement(newElement);
  }, [elements.length, addElement]);

  // 要素更新
  const handleUpdateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return { ...el, ...updates } as EditorElement;
      })
    );
  }, []);

  // 要素削除
  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  // ズーム
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));

  // 次へ（データ選択へ）
  const handleNext = () => {
    // 状態は自動保存されているので、そのまま遷移
    router.push(`/data-select?template=${templateId}`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* サブヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/templates"
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">戻る</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h2 className="font-medium">{template.name}</h2>
          <span className="text-sm text-gray-500">
            {template.width} × {template.height} mm
          </span>

          {/* Undo/Redoボタン */}
          <div className="h-6 w-px bg-border ml-2" />
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="元に戻す (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="やり直す (Ctrl+Shift+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* キーボードショートカットヒント */}
          <div className="text-xs text-gray-400 hidden lg:block">
            矢印: 0.1mm | Shift+矢印: 1mm | Ctrl+Z: 戻す | Ctrl+C/V: コピー
          </div>
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
          >
            次へ：商品データ選択
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ツールバー */}
      <div className="flex-shrink-0">
        <EditorToolbar
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddShape={handleAddShape}
        onAddLine={handleAddLine}
        onAddBarcode={handleAddBarcode}
        onAddQRCode={handleAddQRCode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
          zoom={zoom}
        />
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* キャンバス */}
        <EditorCanvas
          template={template}
          elements={elements}
          selectedElementId={selectedElementId}
          zoom={zoom}
          onSelectElement={setSelectedElementId}
          onUpdateElement={handleUpdateElement}
        />

        {/* プロパティパネル */}
        <div className="w-72 flex-shrink-0 border-l border-border bg-white overflow-y-auto">
          <PropertyPanel
            element={selectedElement}
            onUpdate={handleUpdateElement}
            onDelete={handleDeleteElement}
            roundingMethod={roundingMethod}
            onRoundingChange={setRoundingMethod}
          />
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <Header />
        <ProgressBar currentStep={2} />
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center">読み込み中...</div>}>
          <EditorContent />
        </Suspense>
      </div>
    </main>
  );
}
