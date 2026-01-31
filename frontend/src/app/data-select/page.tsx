'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import SearchFilters, { SearchFiltersType } from '@/components/data-select/SearchFilters';
import ProductTable from '@/components/data-select/ProductTable';
import SelectedProductsSidebar from '@/components/data-select/SelectedProductsSidebar';
import { Product, Category } from '@/types/product';
import { fetchProducts } from '@/lib/api';
import { saveSelectedProducts, loadSelectedProducts } from '@/lib/selectedProductsStorage';

function DataSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // 商品データの状態
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [dataSource, setDataSource] = useState<'smaregi' | 'mock'>('mock');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 商品データから動的にカテゴリ・メーカー・仕入れ先を抽出
  const categories: Category[] = [...new Set(allProducts.map(p => p.categoryName).filter(Boolean))]
    .map((name, index) => ({
      categoryId: `CAT${index}`,
      categoryCode: `CAT${index}`,
      categoryName: name,
      level: 1,
      displaySequence: index,
    }));
  // メーカーはmaker列から取得（groupCodeからマッピング済み）
  const makers = [...new Set(allProducts.map(p => p.maker).filter(Boolean))] as string[];
  const suppliers = [...new Set(allProducts.map(p => p.groupCode).filter(Boolean))];

  const selectedProducts = allProducts.filter(p => selectedIds.includes(p.productId));

  // 初回マウント時に商品データを取得
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const result = await fetchProducts();
        setAllProducts(result.products);
        setFilteredProducts(result.products);
        setDataSource(result.source);
        console.log(`[data-select] ${result.products.length}件の商品を${result.source}から取得`);

        // 保存された選択商品を復元
        const savedProducts = loadSelectedProducts(templateId);
        if (savedProducts && savedProducts.length > 0) {
          const savedIds = savedProducts.map(p => p.productId);
          // 取得した商品データに存在するIDのみ復元
          const validIds = savedIds.filter(id => 
            result.products.some(p => p.productId === id)
          );
          setSelectedIds(validIds);
          console.log(`[data-select] ${validIds.length}件の選択商品を復元`);
        }
      } catch (e: any) {
        console.error('[data-select] 商品データ取得エラー:', e.message);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    loadProducts();
  }, [templateId]);

  // 選択商品が変更されたら保存（初期化後のみ）
  useEffect(() => {
    if (!isInitialized) return;
    
    const productsToSave = allProducts.filter(p => selectedIds.includes(p.productId));
    saveSelectedProducts(productsToSave, templateId);
  }, [selectedIds, allProducts, templateId, isInitialized]);

  // 検索実行
  const handleSearch = useCallback((filters: SearchFiltersType) => {
    setIsLoading(true);
    
    setTimeout(() => {
      let filtered = [...allProducts];

      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        filtered = filtered.filter(p =>
          p.productName.toLowerCase().includes(kw) ||
          p.productCode.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw)
        );
      }

      if (filters.categoryIds.length > 0) {
        // カテゴリ名でフィルタ
        filtered = filtered.filter(p => filters.categoryIds.includes(p.categoryName));
      }

      if (filters.makerIds.length > 0) {
        // メーカー（maker列）でフィルタ
        filtered = filtered.filter(p => p.maker && filters.makerIds.includes(p.maker));
      }

      if (filters.supplierIds.length > 0) {
        filtered = filtered.filter(p => filters.supplierIds.includes(p.groupCode));
      }

      setFilteredProducts(filtered);
      setIsLoading(false);
    }, 300);
  }, [allProducts]);

  // 商品選択
  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredProducts.map(p => p.productId);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  }, [filteredProducts, selectedIds]);

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
    // 選択商品は自動保存されているので、そのまま遷移
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
          {/* データソース表示 */}
          <span className={`text-xs px-2 py-1 rounded ${dataSource === 'smaregi' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {dataSource === 'smaregi' ? 'スマレジ連携中' : 'サンプルデータ'}
          </span>
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
              products={filteredProducts}
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
