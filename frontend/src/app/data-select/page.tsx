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
import { searchProducts, fetchCategoriesWithId, fetchProductFilters } from '@/lib/api';
import { saveSelectedProducts, loadSelectedProducts } from '@/lib/selectedProductsStorage';

function DataSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('template') || 'price-pop';

  // ─── フィルタ用マスタデータ ───
  const [categories, setCategories] = useState<Category[]>([]);
  const [makers, setMakers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  // ─── 商品データ（検索結果） ───
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dataSource, setDataSource] = useState<'smaregi' | 'mock' | null>(null);

  // ─── 選択済み商品（検索をまたいで保持） ───
  const [selectedProducts, setSelectedProducts] = useState<Map<string, Product>>(new Map());

  const selectedIds = Array.from(selectedProducts.keys());
  const selectedProductsList = Array.from(selectedProducts.values());

  // ─── 初回マウント: カテゴリ＋メーカー＋仕入先の一覧を取得 ───
  useEffect(() => {
    console.log('[data-select] ★ DataSelectContent マウント (templateId:', templateId, ')');

    const loadFilters = async () => {
      setIsFiltersLoading(true);
      try {
        const [categoriesResult, filtersResult] = await Promise.all([
          fetchCategoriesWithId(),
          fetchProductFilters(),
        ]);

        setCategories(categoriesResult);
        setMakers(filtersResult.makers);
        setSuppliers(filtersResult.suppliers);

        console.log(`[data-select] フィルタ取得完了: カテゴリ${categoriesResult.length}件, メーカー${filtersResult.makers.length}件, 仕入先${filtersResult.suppliers.length}件`);
      } catch (e: any) {
        console.error('[data-select] フィルタ取得エラー:', e.message);
      } finally {
        setIsFiltersLoading(false);
      }
    };
    loadFilters();

    // 保存された選択商品を復元
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      const map = new Map<string, Product>();
      savedProducts.forEach(p => map.set(p.productId, p));
      setSelectedProducts(map);
    }
  }, [templateId]);

  // ─── 選択商品の自動保存 ───
  useEffect(() => {
    if (selectedProducts.size > 0) {
      saveSelectedProducts(Array.from(selectedProducts.values()), templateId);
    }
  }, [selectedProducts, templateId]);

  // ─── 検索実行（選択は保持） ───
  const handleSearch = useCallback(async (filters: SearchFiltersType) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const result = await searchProducts({
        keyword: filters.keyword || undefined,
        categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
        tags: filters.makerIds.length > 0 ? filters.makerIds : undefined,
        groupCodes: filters.supplierIds.length > 0 ? filters.supplierIds : undefined,
      });

      setSearchResults(result.products);
      setDataSource(result.source);
      console.log(`[data-select] 検索結果: ${result.products.length}件 (${result.source})`);
    } catch (e: any) {
      console.error('[data-select] 検索エラー:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── 選択操作（Mapで管理、検索をまたいで保持） ───
  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const next = new Map(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        const product = searchResults.find(p => p.productId === productId);
        if (product) next.set(productId, product);
      }
      return next;
    });
  }, [searchResults]);

  const handleSelectAll = useCallback(() => {
    const allIds = searchResults.map(p => p.productId);
    const allSelected = allIds.every(id => selectedProducts.has(id));
    setSelectedProducts(prev => {
      const next = new Map(prev);
      if (allSelected) {
        allIds.forEach(id => next.delete(id));
      } else {
        searchResults.forEach(p => next.set(p.productId, p));
      }
      return next;
    });
  }, [searchResults, selectedProducts]);

  const handleRemoveSelected = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedProducts(new Map());
  }, []);

  const handleNext = () => {
    if (selectedProducts.size === 0) {
      alert('商品を1つ以上選択してください');
      return;
    }
    router.push(`/edit?template=${templateId}`);
  };

  return (
    <>
      {/* ヘッダーバー */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/editor?template=${templateId}`} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">デザイン編集に戻る</span>
          </Link>
          {hasSearched && (
            <span className="text-xs text-gray-500">
              検索結果: {searchResults.length}件
            </span>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={selectedProducts.size === 0}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>次へ進む</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{selectedProducts.size}件</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 検索フィルタ */}
          <div className="p-4">
            <SearchFilters
              categories={categories}
              makers={makers}
              suppliers={suppliers}
              onSearch={handleSearch}
              isLoading={isLoading}
              isFiltersLoading={isFiltersLoading}
              hasSearched={hasSearched}
            />
          </div>

          {/* スマレジ未接続の警告 */}
          {dataSource === 'mock' && hasSearched && (
            <div className="px-4">
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>スマレジAPIに接続できていません。サンプルデータを表示しています。</span>
              </div>
            </div>
          )}

          {/* 商品テーブル */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {!hasSearched && !isLoading ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center">
                <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-400 text-lg mb-2">商品を検索してください</p>
                <p className="text-gray-400 text-sm">
                  カテゴリ・メーカー・仕入先を選択して<br />
                  「検索」ボタンを押すと商品データを取得します
                </p>
              </div>
            ) : (
              <ProductTable
                products={searchResults}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        <SelectedProductsSidebar
          products={selectedProductsList}
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
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-gray-500">データ選択を読み込み中...</p></div>}>
        <DataSelectContent />
      </Suspense>
    </main>
  );
}
