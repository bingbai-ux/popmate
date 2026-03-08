// frontend/src/lib/selectedProductsStorage.ts
// 選択商品の保存・復元（sessionStorage使用）

import type { Product } from '@/types/product';
import { getProductKey, getProductImage } from './productImageStore';

const STORAGE_KEY = 'popmate_selected_products';

interface SelectedProductsState {
  products: Product[];
  templateId: string;
  updatedAt: number;
}

/**
 * 選択商品を保存
 * 注意: productImageUrl（base64画像）は非常に大きいため sessionStorage には保存しない。
 * 画像データは productImageStore（メモリ）で管理される。
 */
export function saveSelectedProducts(products: Product[], templateId: string): void {
  try {
    // 画像データを除外して保存（sessionStorage容量制限対策）
    const productsWithoutImages = products.map(p => {
      if (p.productImageUrl) {
        const { productImageUrl: _, ...rest } = p;
        return rest as Product;
      }
      return p;
    });
    const state: SelectedProductsState = {
      products: productsWithoutImages,
      templateId,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('[selectedProductsStorage] 選択商品を保存しました:', products.length, '件');
  } catch (error) {
    console.error('[selectedProductsStorage] 保存エラー:', error);
  }
}

/**
 * 選択商品を復元（メモリストアから画像データも復元）
 */
export function loadSelectedProducts(templateId: string): Product[] | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state: SelectedProductsState = JSON.parse(saved);

    // テンプレートIDが一致しない場合は無効
    if (state.templateId !== templateId) {
      console.log('[selectedProductsStorage] テンプレートIDが一致しないため無視');
      return null;
    }

    // 24時間以上経過している場合は無効
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - state.updatedAt > maxAge) {
      console.log('[selectedProductsStorage] 有効期限切れのため無視');
      clearSelectedProducts();
      return null;
    }

    // メモリストアから画像データを復元
    const productsWithImages = state.products.map(p => {
      const key = getProductKey(p);
      const imageUrl = getProductImage(key);
      if (imageUrl) {
        return { ...p, productImageUrl: imageUrl };
      }
      return p;
    });

    console.log('[selectedProductsStorage] 選択商品を復元しました:', productsWithImages.length, '件');
    return productsWithImages;
  } catch (error) {
    console.error('[selectedProductsStorage] 復元エラー:', error);
    return null;
  }
}

/**
 * 選択商品をクリア
 */
export function clearSelectedProducts(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[selectedProductsStorage] 選択商品をクリアしました');
  } catch (error) {
    console.error('[selectedProductsStorage] クリアエラー:', error);
  }
}
