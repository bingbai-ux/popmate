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
}

export interface Category {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  level: number;
  parentCategoryId?: string;
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
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { categoryId: '1', categoryCode: 'CAT001', categoryName: '食品', level: 1 },
  { categoryId: '2', categoryCode: 'CAT002', categoryName: '雑貨', level: 1 },
  { categoryId: '3', categoryCode: 'CAT003', categoryName: '化粧品', level: 1 },
  { categoryId: '4', categoryCode: 'CAT004', categoryName: '文具', level: 1 },
];
