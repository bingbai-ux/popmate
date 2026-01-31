'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  TEMPLATES,
  DEFAULT_TEXT_STYLE,
} from '@/types/editor';

function EditorContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || 'price-pop';
  const template = TEMPLATES[templateId] || TEMPLATES['price-pop'];

  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 選択中の要素を取得
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  // ユニークIDを生成
  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // テキスト追加
  const handleAddText = useCallback(() => {
    const newElement: TextElement = {
      id: generateId(),
      type: 'text',
      position: { x: 10, y: 10 },
      size: { width: 50, height: 10 },
      rotation: 0,
      zIndex: elements.length,
      content: 'テキストを入力',
      style: { ...DEFAULT_TEXT_STYLE },
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [elements.length]);

  // 画像追加
  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const newElement: ImageElement = {
        id: generateId(),
        type: 'image',
        position: { x: 10, y: 10 },
        size: { width: 30, height: 30 },
        rotation: 0,
        zIndex: elements.length,
        src,
        alt: file.name,
        opacity: 100,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedElementId(newElement.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 要素更新
  const handleUpdateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        if (el.type === 'text') {
          return { ...el, ...updates } as TextElement;
        }
        return { ...el, ...updates } as ImageElement;
      })
    );
  }, []);

  // 要素削除
  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
  }, []);

  // ズーム
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));

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
        </div>

        <Link
          href={`/data-select?template=${templateId}`}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          次へ：商品データを選択
        </Link>
      </div>

      {/* ツールバー */}
      <EditorToolbar
        onAddText={handleAddText}
        onAddImage={handleAddImage}
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
        <PropertyPanel
          element={selectedElement}
          onUpdate={handleUpdateElement}
          onDelete={handleDeleteElement}
        />
      </div>

      {/* 画像アップロード用の隠しinput */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
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
