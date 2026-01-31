// エディターで使用する型定義

export interface Position {
  x: number;  // mm単位
  y: number;  // mm単位
}

export interface Size {
  width: number;   // mm単位
  height: number;  // mm単位
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;      // pt
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface BaseElement {
  id: string;
  type: 'text' | 'image';
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextStyle;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
}

export type EditorElement = TextElement | ImageElement;

export interface TemplateConfig {
  id: string;
  name: string;
  width: number;   // mm
  height: number;  // mm
}

export interface EditorState {
  template: TemplateConfig;
  elements: EditorElement[];
  selectedElementId: string | null;
  zoom: number;
}

// テンプレート設定
export const TEMPLATES: Record<string, TemplateConfig> = {
  'price-pop': { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 },
  'a4': { id: 'a4', name: 'A4サイズ', width: 210, height: 297 },
  'a5': { id: 'a5', name: 'A5サイズ', width: 148, height: 210 },
  'a6': { id: 'a6', name: 'A6サイズ', width: 105, height: 148 },
  'custom': { id: 'custom', name: 'カスタム', width: 100, height: 100 },
};

// デフォルトのテキストスタイル
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Noto Sans JP',
  fontSize: 14,
  fontWeight: 'normal',
  color: '#0A1628',
  textAlign: 'left',
};

// プレースホルダー一覧
export const PLACEHOLDERS = [
  { key: '{{productName}}', label: '商品名' },
  { key: '{{price}}', label: '価格' },
  { key: '{{description}}', label: '商品説明' },
  { key: '{{maker}}', label: 'メーカー名' },
  { key: '{{category}}', label: 'カテゴリー' },
];
