// 商品関連の型定義

export interface Product {
  productId: string;
  productCode: string;
  productName: string;
  price: number;
  categoryId: string;
  categoryName: string;
  groupCode: string;       // メーカー/仕入れ先コード
  description: string;
  tag?: string;            // タグ（メーカー名として使用）
  maker: string;           // メーカー名（groupCodeからマッピング）
  taxDivision: '0' | '1' | '2';  // 税区分 (0:税込, 1:税抜, 2:非課税)
  taxRate: number;         // 計算済み税率 (8 or 10)
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

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// モックデータ（開発用）
export const MOCK_PRODUCTS: Product[] = [
  {
    productId: '1',
    productCode: 'PRD001',
    productName: 'オーガニックコーヒー豆 200g',
    price: 1280,
    categoryId: '1',
    categoryName: '食品',
    groupCode: 'SUP001',
    description: '厳選されたオーガニックコーヒー豆',
    tag: 'コーヒーメーカーA',
    maker: 'コーヒーメーカーA',
    taxDivision: '1',
    taxRate: 8,
  },
  {
    productId: '2',
    productCode: 'PRD002',
    productName: '国産緑茶 100g',
    price: 980,
    categoryId: '1',
    categoryName: '食品',
    groupCode: 'SUP002',
    description: '香り高い国産緑茶',
    tag: 'お茶メーカーB',
    maker: 'お茶メーカーB',
    taxDivision: '1',
    taxRate: 8,
  },
  {
    productId: '3',
    productCode: 'PRD003',
    productName: 'ステンレスタンブラー 350ml',
    price: 2480,
    categoryId: '2',
    categoryName: '雑貨',
    groupCode: 'SUP003',
    description: '保温保冷対応のステンレスタンブラー',
    tag: '雑貨メーカーC',
    maker: '雑貨メーカーC',
    taxDivision: '1',
    taxRate: 10,
  },
  {
    productId: '4',
    productCode: 'PRD004',
    productName: 'エコバッグ Lサイズ',
    price: 1580,
    categoryId: '2',
    categoryName: '雑貨',
    groupCode: 'SUP003',
    description: '丈夫で大容量のエコバッグ',
    tag: '雑貨メーカーC',
    maker: '雑貨メーカーC',
    taxDivision: '1',
    taxRate: 10,
  },
  {
    productId: '5',
    productCode: 'PRD005',
    productName: 'ハンドクリーム 50g',
    price: 880,
    categoryId: '3',
    categoryName: '化粧品',
    groupCode: 'SUP004',
    description: '天然成分配合のハンドクリーム',
    tag: '化粧品メーカーD',
    maker: '化粧品メーカーD',
    taxDivision: '1',
    taxRate: 10,
  },
  {
    productId: '6',
    productCode: 'PRD006',
    productName: 'リップバーム',
    price: 580,
    categoryId: '3',
    categoryName: '化粧品',
    groupCode: 'SUP004',
    description: '保湿力抜群のリップバーム',
    tag: '化粧品メーカーD',
    maker: '化粧品メーカーD',
    taxDivision: '1',
    taxRate: 10,
  },
  {
    productId: '7',
    productCode: 'PRD007',
    productName: 'ノート A5 5冊セット',
    price: 550,
    categoryId: '4',
    categoryName: '文具',
    groupCode: 'SUP005',
    description: '書きやすい罫線入りノート',
    tag: '文具メーカーE',
    maker: '文具メーカーE',
    taxDivision: '1',
    taxRate: 10,
  },
  {
    productId: '8',
    productCode: 'PRD008',
    productName: 'ボールペン 3色セット',
    price: 320,
    categoryId: '4',
    categoryName: '文具',
    groupCode: 'SUP005',
    description: 'なめらかな書き心地のボールペン',
    tag: '文具メーカーE',
    maker: '文具メーカーE',
    taxDivision: '1',
    taxRate: 10,
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { categoryId: '1', categoryCode: 'CAT001', categoryName: '食品', level: 1 },
  { categoryId: '2', categoryCode: 'CAT002', categoryName: '雑貨', level: 1 },
  { categoryId: '3', categoryCode: 'CAT003', categoryName: '化粧品', level: 1 },
  { categoryId: '4', categoryCode: 'CAT004', categoryName: '文具', level: 1 },
];
