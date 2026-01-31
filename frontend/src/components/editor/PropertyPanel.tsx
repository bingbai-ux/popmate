'use client';

import { useState } from 'react';
import { EditorElement, TextElement, ShapeElement, LineElement, BarcodeElement, QRCodeElement, TextStyle, BarcodeSettings, QRCodeSettings } from '@/types/editor';
import { FONTS } from '@/lib/fonts';
import PlaceholderMenu from './PlaceholderMenu';
import type { RoundingMethod } from '@/lib/api';

interface PropertyPanelProps {
  element: EditorElement | null;
  onUpdate: (id: string, updates: Partial<EditorElement>) => void;
  onDelete: (id: string) => void;
  roundingMethod?: RoundingMethod;
  onRoundingChange?: (method: RoundingMethod) => void;
}

export default function PropertyPanel({ 
  element, 
  onUpdate, 
  onDelete,
  roundingMethod = 'floor',
  onRoundingChange,
}: PropertyPanelProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [fontCategory, setFontCategory] = useState<'all' | 'japanese' | 'english'>('all');

  if (!element) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <p className="text-sm text-gray-500 text-center">要素を選択してください</p>
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    onUpdate(element.id, { position: { ...element.position, [axis]: parseFloat(value) || 0 } });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    onUpdate(element.id, { size: { ...element.size, [dimension]: parseFloat(value) || 0 } });
  };

  const handleTextStyleChange = (key: keyof TextStyle, value: unknown) => {
    if (element.type !== 'text') return;
    onUpdate(element.id, { style: { ...element.style, [key]: value } } as Partial<TextElement>);
  };

  const insertPlaceholder = (placeholder: string) => {
    if (element.type !== 'text') return;
    onUpdate(element.id, { content: element.content + placeholder } as Partial<TextElement>);
  };

  const filteredFonts = fontCategory === 'all' ? FONTS : FONTS.filter(f => f.category === fontCategory);



  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 bg-white p-4 border-b border-border flex items-center justify-between z-10">
        <h3 className="font-bold text-sm">
          {element.type === 'text' && 'テキスト'}
          {element.type === 'image' && '画像'}
          {element.type === 'shape' && '図形'}
          {element.type === 'line' && '線'}
          {element.type === 'barcode' && 'バーコード'}
          {element.type === 'qrcode' && 'QRコード'}
        </h3>
        <button onClick={() => onDelete(element.id)} className="p-1 text-gray-400 hover:text-red-500" title="削除">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {element.type === 'text' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">文字を入力</label>
                <div className="relative">
                  <button onClick={() => setShowPlaceholders(!showPlaceholders)} className="text-xs text-primary hover:underline">+ 変数を挿入</button>
                  {showPlaceholders && <PlaceholderMenu onSelect={insertPlaceholder} onClose={() => setShowPlaceholders(false)} />}
                </div>
              </div>
              <textarea value={element.content} onChange={(e) => onUpdate(element.id, { content: e.target.value } as Partial<TextElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none" rows={4} placeholder="文字を入力" />
            </div>


            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">フォント</label>
              <div className="flex gap-1 mb-2">
                {[{ key: 'all', label: 'すべて' }, { key: 'japanese', label: '日本語' }, { key: 'english', label: '英語' }].map((cat) => (
                  <button key={cat.key} onClick={() => setFontCategory(cat.key as 'all' | 'japanese' | 'english')} className={`px-2 py-1 text-xs rounded ${fontCategory === cat.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat.label}</button>
                ))}
              </div>
              <select value={element.style.fontFamily} onChange={(e) => handleTextStyleChange('fontFamily', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" style={{ fontFamily: element.style.fontFamily }}>
                {filteredFonts.map((font) => (<option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">色</label>
              <input type="color" value={element.style.color} onChange={(e) => handleTextStyleChange('color', e.target.value)} className="w-full h-10 border border-border rounded cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">透明度</label>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="100" value={element.style.opacity} onChange={(e) => handleTextStyleChange('opacity', parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm text-gray-600 w-10 text-right">{element.style.opacity}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">サイズ</label>
              <input type="number" min="6" max="500" value={element.style.fontSize} onChange={(e) => handleTextStyleChange('fontSize', parseInt(e.target.value) || 14)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.autoSize} onChange={(e) => handleTextStyleChange('autoSize', e.target.checked)} className="w-4 h-4" /><span>自動</span></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.autoWrap} onChange={(e) => handleTextStyleChange('autoWrap', e.target.checked)} className="w-4 h-4" /><span>自動折り返し</span></label>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">字間</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.1" value={element.style.letterSpacing} onChange={(e) => handleTextStyleChange('letterSpacing', parseFloat(e.target.value) || 0)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                <span className="text-xs text-gray-500">pt</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">行間</label>
              <div className="flex items-center gap-2">
                <input type="number" min="50" max="300" value={element.style.lineHeight} onChange={(e) => handleTextStyleChange('lineHeight', parseInt(e.target.value) || 120)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">文字方向</label>
              <div className="flex gap-2">
                <button onClick={() => handleTextStyleChange('writingMode', 'horizontal')} className={`flex-1 py-2 rounded-lg border text-sm ${element.style.writingMode === 'horizontal' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-gray-50'}`}>横書き</button>
                <button onClick={() => handleTextStyleChange('writingMode', 'vertical')} className={`flex-1 py-2 rounded-lg border text-sm ${element.style.writingMode === 'vertical' ? 'bg-primary text-white border-primary' : 'border-border hover:bg-gray-50'}`}>縦書き</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">水平配置</label>
              <div className="flex gap-1">
                {['left', 'center', 'right', 'justify'].map((align) => (
                  <button key={align} onClick={() => handleTextStyleChange('textAlign', align)} className={`flex-1 py-2 rounded border ${element.style.textAlign === align ? 'bg-primary text-white border-primary' : 'border-border hover:bg-gray-50'}`} title={align}>
                    <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                      {align === 'left' && <path d="M3 5h18v2H3V5zm0 4h12v2H3V9zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />}
                      {align === 'center' && <path d="M3 5h18v2H3V5zm3 4h12v2H6V9zm-3 4h18v2H3v-2zm3 4h12v2H6v-2z" />}
                      {align === 'right' && <path d="M3 5h18v2H3V5zm6 4h12v2H9V9zm-6 4h18v2H3v-2zm6 4h12v2H9v-2z" />}
                      {align === 'justify' && <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">垂直配置</label>
              <div className="flex gap-1">
                {[{ value: 'top', label: '上' }, { value: 'middle', label: '中' }, { value: 'bottom', label: '下' }].map((align) => (
                  <button key={align.value} onClick={() => handleTextStyleChange('verticalAlign', align.value)} className={`flex-1 py-2 rounded border text-sm ${element.style.verticalAlign === align.value ? 'bg-primary text-white border-primary' : 'border-border hover:bg-gray-50'}`}>{align.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">スタイル</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.fontWeight === 'bold'} onChange={(e) => handleTextStyleChange('fontWeight', e.target.checked ? 'bold' : 'normal')} className="w-4 h-4" /><span className="font-bold">太字</span></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.fontStyle === 'italic'} onChange={(e) => handleTextStyleChange('fontStyle', e.target.checked ? 'italic' : 'normal')} className="w-4 h-4" /><span className="italic">斜体</span></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.textDecoration === 'underline'} onChange={(e) => handleTextStyleChange('textDecoration', e.target.checked ? 'underline' : 'none')} className="w-4 h-4" /><span className="underline">下線</span></label>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">文字横幅</label>
              <div className="flex items-center gap-2">
                <input type="number" min="50" max="200" value={element.style.textWidth} onChange={(e) => handleTextStyleChange('textWidth', parseInt(e.target.value) || 100)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.fullWidth} onChange={(e) => handleTextStyleChange('fullWidth', e.target.checked)} className="w-4 h-4" /><span>全角</span></label>
            </div>
          </>
        )}

        {element.type === 'shape' && (
          <>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">塗りつぶし色</label><input type="color" value={element.style.fill} onChange={(e) => onUpdate(element.id, { style: { ...element.style, fill: e.target.value } } as Partial<ShapeElement>)} className="w-full h-10 border border-border rounded cursor-pointer" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">枠線色</label><input type="color" value={element.style.stroke} onChange={(e) => onUpdate(element.id, { style: { ...element.style, stroke: e.target.value } } as Partial<ShapeElement>)} className="w-full h-10 border border-border rounded cursor-pointer" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">枠線の太さ</label><input type="number" min="0" max="20" value={element.style.strokeWidth} onChange={(e) => onUpdate(element.id, { style: { ...element.style, strokeWidth: parseFloat(e.target.value) || 0 } } as Partial<ShapeElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          </>
        )}

        {element.type === 'line' && (
          <>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">線の色</label><input type="color" value={element.style.stroke} onChange={(e) => onUpdate(element.id, { style: { ...element.style, stroke: e.target.value } } as Partial<LineElement>)} className="w-full h-10 border border-border rounded cursor-pointer" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">線の太さ</label><input type="number" min="1" max="20" value={element.style.strokeWidth} onChange={(e) => onUpdate(element.id, { style: { ...element.style, strokeWidth: parseFloat(e.target.value) || 1 } } as Partial<LineElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.style.endArrow} onChange={(e) => onUpdate(element.id, { style: { ...element.style, endArrow: e.target.checked } } as Partial<LineElement>)} className="w-4 h-4" /><span>矢印を表示</span></label></div>
          </>
        )}

        {element.type === 'barcode' && (
          <>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">バーコード形式</label><select value={element.settings.format} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, format: e.target.value as BarcodeSettings['format'] } } as Partial<BarcodeElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="CODE128">CODE128</option><option value="EAN13">EAN-13 (JAN)</option><option value="EAN8">EAN-8</option><option value="UPC">UPC</option><option value="CODE39">CODE39</option></select></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">値</label><input type="text" value={element.settings.value} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, value: e.target.value } } as Partial<BarcodeElement>)} placeholder="{{productCode}} または数値" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={element.settings.displayValue} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, displayValue: e.target.checked } } as Partial<BarcodeElement>)} className="w-4 h-4" /><span>数値を表示</span></label></div>
          </>
        )}

        {element.type === 'qrcode' && (
          <>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">値</label><input type="text" value={element.settings.value} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, value: e.target.value } } as Partial<QRCodeElement>)} placeholder="URL、テキスト、{{productCode}} など" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">サイズ</label><input type="number" min="50" max="500" value={element.settings.size} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, size: parseInt(e.target.value) || 100 } } as Partial<QRCodeElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">前景色</label><input type="color" value={element.settings.fgColor} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, fgColor: e.target.value } } as Partial<QRCodeElement>)} className="w-full h-10 border border-border rounded cursor-pointer" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">背景色</label><input type="color" value={element.settings.bgColor} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, bgColor: e.target.value } } as Partial<QRCodeElement>)} className="w-full h-10 border border-border rounded cursor-pointer" /></div>
            <div><label className="text-xs font-medium text-gray-500 block mb-2">エラー訂正レベル</label><select value={element.settings.errorCorrectionLevel} onChange={(e) => onUpdate(element.id, { settings: { ...element.settings, errorCorrectionLevel: e.target.value as QRCodeSettings['errorCorrectionLevel'] } } as Partial<QRCodeElement>)} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="L">L (7%)</option><option value="M">M (15%)</option><option value="Q">Q (25%)</option><option value="H">H (30%)</option></select></div>
          </>
        )}

        <div className="pt-4 border-t border-border">
          <label className="text-xs font-medium text-gray-500 block mb-2">位置 (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-400">X</label><input type="number" step="0.1" value={element.position.x} onChange={(e) => handlePositionChange('x', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
            <div><label className="text-xs text-gray-400">Y</label><input type="number" step="0.1" value={element.position.y} onChange={(e) => handlePositionChange('y', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">サイズ (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-gray-400">幅</label><input type="number" step="0.1" value={element.size.width} onChange={(e) => handleSizeChange('width', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
            <div><label className="text-xs text-gray-400">高さ</label><input type="number" step="0.1" value={element.size.height} onChange={(e) => handleSizeChange('height', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
