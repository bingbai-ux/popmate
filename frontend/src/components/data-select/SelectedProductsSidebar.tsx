'use client';

import { Product } from '@/types/product';

interface SelectedProductsSidebarProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClearAll: () => void;
}

export default function SelectedProductsSidebar({
  products,
  onRemove,
  onClearAll,
}: SelectedProductsSidebarProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  return (
    <div className="w-80 bg-white border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-text-dark">
            選択中の商品
            <span className="ml-2 text-primary">({products.length}件)</span>
          </h3>
          {products.length > 0 && (
            <button onClick={onClearAll} className="text-xs text-gray-500 hover:text-red-500 transition-colors">
              すべて解除
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">商品を選択してください</div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.productId} className="bg-gray-50 rounded-lg p-3 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">{product.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{product.productCode}</p>
                    <p className="text-sm text-primary font-medium mt-1">{formatPrice(product.price)}</p>
                  </div>
                  <button onClick={() => onRemove(product.productId)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
