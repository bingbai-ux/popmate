'use client';

import { useState } from 'react';

interface EditorToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (shapeType: string) => void;
  onAddLine: (lineType: string) => void;
  onAddBarcode: () => void;
  onAddQRCode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export default function EditorToolbar({
  onAddText,
  onAddImage,
  onAddShape,
  onAddLine,
  onAddBarcode,
  onAddQRCode,
  onZoomIn,
  onZoomOut,
  zoom,
}: EditorToolbarProps) {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);

  const shapes = [
    { type: 'rectangle', label: '四角形', icon: '□' },
    { type: 'roundedRect', label: '角丸四角形', icon: '▢' },
    { type: 'circle', label: '円', icon: '○' },
    { type: 'triangle', label: '三角形', icon: '△' },
    { type: 'star', label: '星', icon: '☆' },
  ];

  const lines = [
    { type: 'straight', label: '直線', icon: '─' },
    { type: 'arrow', label: '矢印', icon: '→' },
  ];

  return (
    <div className="bg-white border-b border-border px-4 py-2 flex items-center gap-2 flex-wrap">
      <button
        onClick={onAddText}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="テキストを追加"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-sm">テキスト</span>
      </button>

      <button
        onClick={onAddImage}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="画像を追加"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm">画像</span>
      </button>

      <div className="h-6 w-px bg-border mx-1" />

      <div className="relative">
        <button
          onClick={() => {
            setShowShapeMenu(!showShapeMenu);
            setShowLineMenu(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="図形を追加"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
          </svg>
          <span className="text-sm">図形</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showShapeMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
            {shapes.map((shape) => (
              <button
                key={shape.type}
                onClick={() => {
                  onAddShape(shape.type);
                  setShowShapeMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-lg w-6 text-center">{shape.icon}</span>
                <span className="text-sm">{shape.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setShowLineMenu(!showLineMenu);
            setShowShapeMenu(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="線を追加"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20L20 4" />
          </svg>
          <span className="text-sm">線</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showLineMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
            {lines.map((line) => (
              <button
                key={line.type}
                onClick={() => {
                  onAddLine(line.type);
                  setShowLineMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="text-lg w-6 text-center">{line.icon}</span>
                <span className="text-sm">{line.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      <button
        onClick={onAddBarcode}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="バーコードを追加"
      >
        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm2 0h2v16H8V4zm4 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h1v16h-1V4zm2 0h1v16h-1V4z" />
        </svg>
        <span className="text-sm">バーコード</span>
      </button>

      <button
        onClick={onAddQRCode}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="QRコードを追加"
      >
        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 1h3v2h-3v-2z" />
        </svg>
        <span className="text-sm">QRコード</span>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 border-l border-border pl-4">
        <button onClick={onZoomOut} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="縮小">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="拡大">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
