'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import SearchFilters, { SearchFiltersType } from '@/components/data-select/SearchFilters';
import ProductTable from '@/components/data-select/ProductTable';
import SelectedProductsSidebar from '@/components/data-select/SelectedProductsSidebar';
import { Product, Category, MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/types/product';

function DataSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // メーカー・仕入れ先の一覧を抽出
  const makers = [...new Set(MOCK_PRODUCTS.map(p => p.tag).filter(Boolean))] as string[];
  const suppliers = [...new Set(MOCK_PRODUCTS.map(p => p.groupCode).filter(Boolean))];

  const selectedProducts = products.filter(p => selectedIds.includes(p.productId));

  // 検索実行
  const handleSearch = useCallback((filters: SearchFiltersType) => {
    setIsLoading(true);
    
    setTimeout(() => {
      let filtered = [...MOCK_PRODUCTS];

      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        filtered = filtered.filter(p =>
          p.productName.toLowerCase().includes(kw) ||
          p.productCode.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw)
        );
      }

      if (filters.categoryIds.length > 0) {
        filtered = filtered.filter(p => filters.categoryIds.includes(p.categoryId));
      }

      if (filters.makerIds.length > 0) {
        filtered = filtered.filter(p => p.tag && filters.makerIds.includes(p.tag));
      }

      if (filters.supplierIds.length > 0) {
        filtered = filtered.filter(p => filters.supplierIds.includes(p.groupCode));
      }

      setProducts(filtered);
      setIsLoading(false);
    }, 300);
  }, []);

  // 商品選択
  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = products.map(p => p.productId);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  }, [products, selectedIds]);

  const handleRemoveSelected = useCallback((productId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== productId));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleNext = () => {
    if (selectedProducts.length === 0) {
      alert('商品を1つ以上選択してください');
      return;
    }
    sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    router.push(`/edit?template=${templateId}`);
  };

  return (
    <>
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/editor?template=${templateId}`} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">デザイン編集に戻る</span>
          </Link>
        </div>
        <button
          onClick={handleNext}
          disabled={selectedProducts.length === 0}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>次へ進む</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{selectedProducts.length}件</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4">
            <SearchFilters
              categories={categories}
              makers={makers}
              suppliers={suppliers}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>

          <div className="flex-1 overflow-auto px-4 pb-4">
            <ProductTable
              products={products}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              isLoading={isLoading}
            />
          </div>
        </div>

        <SelectedProductsSidebar
          products={selectedProducts}
          onRemove={handleRemoveSelected}
          onClearAll={handleClearAll}
        />
      </div>
    </>
  );
}

export default function DataSelectPage() {
  return (
    <main className="min-h-screen bg-background-light flex flex-col">
      <Header />
      <ProgressBar currentStep={3} />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">読み込み中...</div>}>
        <DataSelectContent />
      </Suspense>
    </main>
  );
}
