'use client';

import { Product } from '@/types/product';

interface SelectedProductsProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClearAll: () => void;
}

export default function SelectedProducts({ products, onRemove, onClearAll }: SelectedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-text-dark">
          選択中の商品
          <span className="ml-2 text-primary">({products.length}件)</span>
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          すべて解除
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {products.map((product) => (
          <div
            key={product.productId}
            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-border"
          >
            <span className="text-sm">{product.productName}</span>
            <span className="text-xs text-primary font-medium">
              {formatPrice(product.price)}
            </span>
            <button
              onClick={() => onRemove(product.productId)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
