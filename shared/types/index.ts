// @popmate/shared - 共有型定義
// フロントエンド・バックエンドで共通使用する型を一元管理

// ============================================
// Position & Size
// ============================================

export interface Position {
  x: number;  // mm
  y: number;  // mm
}

export interface Size {
  width: number;   // mm
  height: number;  // mm
}

// ============================================
// User Types
// ============================================

export interface PopmateUser {
  id: string;
  email: string;
  smaregi_contract_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Template Types
// ============================================

export type TemplateType = 'price_pop' | 'a4' | 'a5' | 'a6' | 'custom';

export interface PopmateTemplate {
  id: string;
  user_id: string | null;
  name: string;
  type: TemplateType;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  width: number;
  height: number;
}

// ============================================
// Design Data Types
// ============================================

export interface DesignData {
  background: BackgroundSettings;
  elements: DesignElement[];
}

export interface BackgroundSettings {
  color: string;
  image_url?: string;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'line' | 'barcode' | 'qrcode' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  properties: ElementProperties;
}

export interface ElementProperties {
  // Text properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline';
  writingMode?: 'horizontal' | 'vertical';
  opacity?: number;

  // Image properties
  src?: string;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill';

  // Shape properties
  shapeType?: 'rectangle' | 'roundedRect' | 'circle' | 'triangle' | 'star' | 'line';
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  cornerRadius?: number;

  // Line properties
  lineType?: 'straight' | 'arrow';
  startArrow?: boolean;
  endArrow?: boolean;
  strokeDasharray?: string;

  // Barcode properties
  barcodeFormat?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';
  barcodeValue?: string;
  displayValue?: boolean;

  // QRCode properties
  qrValue?: string;
  qrSize?: number;
  qrFgColor?: string;
  qrBgColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';

  // Table properties
  rows?: number;
  cols?: number;
  cellData?: string[][];
  borderColor?: string;
  borderWidth?: number;
}

// ============================================
// Product Types (Smaregi)
// ============================================

export interface SmaregiProduct {
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  taxRate?: number;
  categoryId?: string;
  categoryName?: string;
  groupCode?: string;        // グループコード → 仕入先
  tag?: string;              // タグ → メーカー
  supplierProductNo?: string;
  description?: string;
  // 税関連フィールド
  taxDivision?: string;       // 税区分 (0:税込, 1:税抜, 2:非課税)
  reduceTaxId?: string | null; // 軽減税率ID
  useCategoryReduceTax?: string; // 部門の軽減税率設定を使用するか
}

export interface SmaregiCategory {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  level: number;
  parentCategoryId?: string;
}

export interface SmaregiSupplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
}

// フロントエンド用のProduct型（SmaregiProductの拡張）
export interface Product extends SmaregiProduct {
  maker: string;  // tag のエイリアス
}

export interface Category {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  level: number;
  parentCategoryId?: string;
}

export interface Supplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
}

// ============================================
// Saved Pop Types
// ============================================

export interface PopmateSavedPop {
  id: string;
  user_id: string;
  name: string;
  template_id: string | null;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
  selected_products: SelectedProduct[];
  print_settings: PrintSettings;
  created_at: string;
  updated_at: string;
}

export interface SelectedProduct {
  product_id: string;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate?: number;
  category_name?: string;
  image_url?: string;
}

export interface PrintSettings {
  paper_size: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  border_enabled: boolean;
  border_color: string;
  border_width: number;
  margin_mm: number;
}

// ============================================
// Tax Settings
// ============================================

export interface TaxSettings {
  enabled: boolean;
  taxRate: number;            // 税率（%）
  roundingMode: RoundingMethod;
}

export type RoundingMethod = 'round' | 'floor' | 'ceil';

// ============================================
// Project Types (Local Storage)
// ============================================

export type SaveType = 'template' | 'project';

export interface SavedProject {
  id: string;
  name: string;
  saveType: SaveType;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
  template: TemplateConfig;
  elements: DesignElement[];
  selectedProducts: SmaregiProduct[];
  taxSettings: TaxSettings;
  editedProductData: Record<string, Partial<SmaregiProduct>>;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateTemplateRequest {
  name: string;
  type: TemplateType;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
}

export interface UpdateTemplateRequest {
  name?: string;
  width_mm?: number;
  height_mm?: number;
  design_data?: DesignData;
}

export interface SavePopRequest {
  name: string;
  template_id?: string;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
  selected_products: SelectedProduct[];
  print_settings: PrintSettings;
}

export interface ProductSearchParams {
  keyword?: string;
  categoryIds?: string[];
  groupCodes?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
}

// ============================================
// Webhook Types
// ============================================

export type WebhookEventType =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    id: string;
    [key: string]: any;
  };
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  enabled: true,
  taxRate: 10,
  roundingMode: 'floor',
};

export const TEMPLATES: Record<string, TemplateConfig> = {
  'price-pop': { id: 'price-pop', name: 'プライスポップ', width: 91, height: 55 },
  'a4': { id: 'a4', name: 'A4サイズ', width: 210, height: 297 },
  'a5': { id: 'a5', name: 'A5サイズ', width: 148, height: 210 },
  'a6': { id: 'a6', name: 'A6サイズ', width: 105, height: 148 },
  'custom': { id: 'custom', name: 'カスタム', width: 100, height: 100 },
};

// ============================================
// Placeholder Types
// ============================================

export interface PlaceholderDefinition {
  key: string;
  label: string;
}

export const PLACEHOLDERS: PlaceholderDefinition[] = [
  { key: '{{productCode}}', label: '商品コード' },
  { key: '{{category}}', label: 'カテゴリー' },
  { key: '{{maker}}', label: 'メーカー名' },
  { key: '{{productName}}', label: '商品名' },
  { key: '{{price}}', label: '価格（税抜）' },
  { key: '{{taxIncludedPrice}}', label: '税込価格' },
  { key: '{{description}}', label: '商品説明' },
];
