'use client';

import { useState, useCallback, Suspense } from 'react';
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

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

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
      content: 'テキスト',
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
    sessionStorage.setItem('templateElements', JSON.stringify(elements));
    router.push(`/data-select?template=${templateId}`);
  };

  return (
    <>
      {/* サブヘッダー */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
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
        </div>

        <button onClick={handleNext} className="btn-primary text-sm py-2">
          次へ：商品データ選択
        </button>
      </div>

      {/* ツールバー */}
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

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
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
        <div className="w-72 border-l border-border bg-white overflow-y-auto">
          <PropertyPanel
            element={selectedElement}
            onUpdate={handleUpdateElement}
            onDelete={handleDeleteElement}
          />
        </div>
      </div>
    </>
  );
}

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-background-light flex flex-col">
      <Header />
      <ProgressBar currentStep={2} />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">読み込み中...</div>}>
        <EditorContent />
      </Suspense>
    </main>
  );
}
