// エディターで使用する型定義（拡張版）

export interface Position {
  x: number;  // mm
  y: number;  // mm
}

export interface Size {
  width: number;   // mm
  height: number;  // mm
}

// 拡張テキストスタイル
export interface TextStyle {
  fontFamily: string;
  fontSize: number;           // pt
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  opacity: number;            // 0-100
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  letterSpacing: number;      // pt (字間)
  lineHeight: number;         // % (行間)
  textDecoration: 'none' | 'underline';
  writingMode: 'horizontal' | 'vertical';  // 横書き/縦書き
  textWidth: number;          // % (文字横幅)
  autoSize: boolean;          // サイズ自動
  autoWrap: boolean;          // 自動折り返し
  fullWidth: boolean;         // 全角
}

// 図形スタイル
export interface ShapeStyle {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  cornerRadius?: number;      // 角丸（四角形用）
}

// 線スタイル
export interface LineStyle {
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray?: string;   // 破線パターン
  startArrow: boolean;
  endArrow: boolean;
}

// バーコード設定
export interface BarcodeSettings {
  format: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';
  value: string;              // バーコード値（プレースホルダー可）
  displayValue: boolean;      // 数値を表示するか
  fontSize: number;
  lineColor: string;
  background: string;
  height: number;             // バーコードの高さ（px）
  width: number;              // バーコードの線幅（1-4）
}

// QRコード設定
export interface QRCodeSettings {
  value: string;              // QRコード値（プレースホルダー可）
  size: number;
  fgColor: string;
  bgColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

// 税込価格設定
export interface TaxSettings {
  enabled: boolean;
  taxRate: number;            // 税率（%）
  roundingMode: 'round' | 'floor' | 'ceil';  // 四捨五入/切り捨て/切り上げ
}

// ベース要素
export interface BaseElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'line' | 'barcode' | 'qrcode';
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  locked?: boolean;
}

// テキスト要素
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextStyle;
}

// 画像要素
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  opacity: number;
}

// 図形要素
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'roundedRect' | 'circle' | 'triangle' | 'star';
  style: ShapeStyle;
}

// 線要素
export interface LineElement extends BaseElement {
  type: 'line';
  lineType: 'straight' | 'arrow';
  startPoint: Position;
  endPoint: Position;
  style: LineStyle;
}

// バーコード要素
export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  settings: BarcodeSettings;
}

// QRコード要素
export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  settings: QRCodeSettings;
}

export type EditorElement = TextElement | ImageElement | ShapeElement | LineElement | BarcodeElement | QRCodeElement;

export interface TemplateConfig {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface EditorState {
  template: TemplateConfig;
  elements: EditorElement[];
  selectedElementId: string | null;
  zoom: number;
  taxSettings: TaxSettings;
}

// テンプレート設定
export const TEMPLATES: Record<string, TemplateConfig> = {
  'price-pop': { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 },
  'a4': { id: 'a4', name: 'A4サイズ', width: 210, height: 297 },
  'a5': { id: 'a5', name: 'A5サイズ', width: 148, height: 210 },
  'a6': { id: 'a6', name: 'A6サイズ', width: 105, height: 148 },
  'custom': { id: 'custom', name: 'カスタム', width: 100, height: 100 },
};

// デフォルトテキストスタイル
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Noto Sans JP',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#0A1628',
  opacity: 100,
  textAlign: 'left',
  verticalAlign: 'top',
  letterSpacing: 0,
  lineHeight: 120,
  textDecoration: 'none',
  writingMode: 'horizontal',
  textWidth: 100,
  autoSize: true,
  autoWrap: false,
  fullWidth: false,
};

// デフォルト図形スタイル
export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fill: '#2563EB',
  fillOpacity: 100,
  stroke: '#1E40AF',
  strokeWidth: 1,
  strokeOpacity: 100,
  cornerRadius: 0,
};

// デフォルト線スタイル
export const DEFAULT_LINE_STYLE: LineStyle = {
  stroke: '#0A1628',
  strokeWidth: 1,
  strokeOpacity: 100,
  startArrow: false,
  endArrow: false,
};

// デフォルトバーコード設定
export const DEFAULT_BARCODE_SETTINGS: BarcodeSettings = {
  format: 'CODE128',
  value: '{{productCode}}',
  displayValue: true,
  fontSize: 12,
  lineColor: '#000000',
  background: '#FFFFFF',
  height: 50,
  width: 2,
};

// デフォルトQRコード設定
export const DEFAULT_QRCODE_SETTINGS: QRCodeSettings = {
  value: '{{productCode}}',
  size: 100,
  fgColor: '#000000',
  bgColor: '#FFFFFF',
  errorCorrectionLevel: 'M',
};

// デフォルト税設定
export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  enabled: true,
  taxRate: 10,
  roundingMode: 'floor',
};

// プレースホルダー一覧（表示順: 商品コード、カテゴリー、メーカー名、商品名、価格、税込価格、商品説明）
export const PLACEHOLDERS = [
  { key: '{{productCode}}', label: '商品コード' },
  { key: '{{category}}', label: 'カテゴリー' },
  { key: '{{maker}}', label: 'メーカー名' },
  { key: '{{productName}}', label: '商品名' },
  { key: '{{price}}', label: '価格（税抜）' },
  { key: '{{taxIncludedPrice}}', label: '税込価格' },
  { key: '{{description}}', label: '商品説明' },
];
