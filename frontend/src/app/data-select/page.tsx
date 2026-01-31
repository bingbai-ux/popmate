'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import SearchFilters from '@/components/data-select/SearchFilters';
import ProductTable from '@/components/data-select/ProductTable';
import SelectedProducts from '@/components/data-select/SelectedProducts';
import { Product, Category } from '@/types/product';
import { fetchProducts, fetchCategories } from '@/lib/api';

function DataSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 選択済み商品を取得
  const selectedProducts = products.filter(p => selectedIds.includes(p.productId));

  // 初期データ読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productsData, categoriesData] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '商品データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 検索実行
  const handleSearch = useCallback(async (keyword: string, categoryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const productsData = await fetchProducts({ keyword, categoryId });
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 商品選択トグル
  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  // 全選択/解除
  const handleSelectAll = useCallback(() => {
    const allIds = products.map(p => p.productId);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  }, [products, selectedIds]);

  // 選択解除
  const handleRemoveSelected = useCallback((productId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== productId));
  }, []);

  // 全て解除
  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // 次へ進む
  const handleNext = () => {
    if (selectedProducts.length === 0) {
      alert('商品を1つ以上選択してください');
      return;
    }
    
    // 選択した商品データをセッションストレージに保存
    sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    
    // 編集画面へ遷移
    router.push(`/edit?template=${templateId}`);
  };

  return (
    <>
      {/* サブヘッダー */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/editor?template=${templateId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">戻る</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h2 className="font-medium">商品データを選択</h2>
        </div>

        <button
          onClick={handleNext}
          disabled={selectedProducts.length === 0}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ：編集画面 ({selectedProducts.length}件選択中)
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 p-6 space-y-4">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* 検索フィルター */}
        <SearchFilters
          categories={categories}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* 選択済み商品 */}
        <SelectedProducts
          products={selectedProducts}
          onRemove={handleRemoveSelected}
          onClearAll={handleClearAll}
        />

        {/* 商品テーブル */}
        <ProductTable
          products={products}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          isLoading={isLoading}
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
