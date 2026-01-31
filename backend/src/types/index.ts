// ===== User Types =====
export interface PopmateUser {
  id: string;
  email: string;
  smaregi_contract_id: string | null;
  created_at: string;
  updated_at: string;
}

// ===== Template Types =====
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

// ===== Design Data Types =====
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
  type: 'text' | 'image' | 'shape' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  properties: ElementProperties;
}

export interface ElementProperties {
  // Text properties
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // Image properties
  src?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  
  // Shape properties
  shapeType?: 'rectangle' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  
  // Table properties
  rows?: number;
  cols?: number;
  cellData?: string[][];
  borderColor?: string;
  borderWidth?: number;
}

// ===== Saved Pop Types =====
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

// ===== Smaregi API Types =====
export interface SmaregiProduct {
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  taxRate?: number;
  categoryId?: string;
  categoryName?: string;
  groupCode?: string;
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

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

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

// ===== Request Types =====
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
  category_id?: string;
  page?: number;
  limit?: number;
}
