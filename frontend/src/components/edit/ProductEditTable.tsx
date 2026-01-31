'use client';

import { Product } from '@/types/product';
import { TaxSettings } from '@/types/editor';
import { calculateTaxIncludedPrice, formatPrice } from '@/lib/placeholderUtils';

interface ProductEditTableProps {
  products: Product[];
  selectedProductId: string | null;
  taxSettings: TaxSettings;
  onSelectProduct: (productId: string) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
}

export default function ProductEditTable({
  products,
  selectedProductId,
  taxSettings,
  onSelectProduct,
  onUpdateProduct,
}: ProductEditTableProps) {
  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-text-dark">
            商品データ ({products.length}件)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            行をクリックでプレビュー切替。商品名・価格・説明はクリックで直接編集できます。
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-white">
              <th className="w-10 px-3 py-2.5 text-center text-xs font-bold">No</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold">商品コード</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold min-w-[180px]">商品名</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">税抜価格</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">税込価格</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold">カテゴリ</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold min-w-[150px]">説明</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const isSelected = product.productId === selectedProductId;
              const taxIncluded = calculateTaxIncludedPrice(
                product.price,
                taxSettings.taxRate,
                taxSettings.roundingMode
              );

              return (
                <tr
                  key={product.productId}
                  className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/5 ring-2 ring-inset ring-primary/30'
                      : index % 2 === 0
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-gray-50/50 hover:bg-gray-100'
                  }`}
                  onClick={() => onSelectProduct(product.productId)}
                >
                  <td className="px-3 py-2.5 text-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 mx-auto flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      {isSelected ? '✓' : index + 1}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-500 font-mono">
                    {product.productCode}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={product.productName}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateProduct(product.productId, { productName: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateProduct(product.productId, { price: parseInt(e.target.value) || 0 });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-24 px-2 py-1 text-sm text-right border border-transparent hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded transition-colors"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-bold text-primary">
                    {formatPrice(taxIncluded)}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600">
                    {product.categoryName}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="text"
                      value={product.description}
                      onChange={(e) => {
                        e.stopPropagation();
                        onUpdateProduct(product.productId, { description: e.target.value });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded transition-colors"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
