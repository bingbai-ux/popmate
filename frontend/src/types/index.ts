// テンプレートタイプ
export type TemplateType = 'price_pop' | 'a4_pop' | 'a5_pop' | 'a6_pop' | 'a4' | 'a5' | 'a6' | 'custom';

// テンプレート
export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
  is_system: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// デザインデータ
export interface DesignData {
  elements: DesignElement[];
  background_color?: string;
  border?: BorderStyle;
}

// デザイン要素
export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'barcode' | 'product_field';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties: ElementProperties;
}

// 要素プロパティ
export interface ElementProperties {
  // テキスト
  text?: string;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  color?: string;
  text_align?: 'left' | 'center' | 'right';
  
  // 画像
  image_url?: string;
  
  // 商品フィールド
  field_name?: string;
  
  // テーブル
  rows?: number;
  columns?: number;
  cell_data?: string[][];
}

// 枠線スタイル
export interface BorderStyle {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

// 保存データ
export interface SavedPop {
  id: string;
  name: string;
  user_id: string;
  template_id?: string;
  width_mm: number;
  height_mm: number;
  design_data: DesignData;
  selected_products: SelectedProduct[];
  print_settings?: PrintSettings;
  created_at: string;
  updated_at: string;
}

// 選択された商品
export interface SelectedProduct {
  product_id: string;
  product_code: string;
  product_name: string;
  price: number;
  tax_rate?: number;
  category_name?: string;
}

// 印刷設定
export interface PrintSettings {
  paper_size: 'A4' | 'A3';
  orientation: 'portrait' | 'landscape';
  margin_mm: number;
  border_width?: number;
  border_color?: string;
}

// スマレジ商品
export interface SmaregiProduct {
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  taxRate?: number;
  categoryId?: string;
  categoryName?: string;
}

// スマレジカテゴリ
export interface SmaregiCategory {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  level: number;
  parentCategoryId?: string;
}

// ワークフローステップ
export type WorkflowStep = 'template' | 'design' | 'data' | 'preview' | 'print';

// APIレスポンス
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ページネーション
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
