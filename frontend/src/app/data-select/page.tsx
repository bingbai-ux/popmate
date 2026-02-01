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
  const [makers, setMakers] = useState<string[]>([]);       // メーカー = tag 一覧
  const [suppliers, setSuppliers] = useState<string[]>([]);  // 仕入先 = groupCode 一覧
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  // ─── 商品データ（検索結果） ───
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dataSource, setDataSource] = useState<'smaregi' | 'mock'>('mock');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedProducts = allProducts.filter(p => selectedIds.includes(p.productId));

  // ─── 初回マウント: カテゴリ＋メーカー＋仕入先の一覧を取得 ───
  useEffect(() => {
    const loadFilters = async () => {
      setIsFiltersLoading(true);
      try {
        // カテゴリとフィルタ(メーカー/仕入先)を並行取得
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

    // 保存された選択商品IDを復元
    const savedProducts = loadSelectedProducts(templateId);
    if (savedProducts && savedProducts.length > 0) {
      setSelectedIds(savedProducts.map(p => p.productId));
    }
  }, [templateId]);

  // ─── 選択商品の自動保存 ───
  useEffect(() => {
    if (!hasSearched && selectedIds.length === 0) return;
    const productsToSave = allProducts.filter(p => selectedIds.includes(p.productId));
    if (productsToSave.length > 0) {
      saveSelectedProducts(productsToSave, templateId);
    }
  }, [selectedIds, allProducts, templateId, hasSearched]);

  // ─── 検索実行 ───
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

      setAllProducts(result.products);
      setDataSource(result.source);
      console.log(`[data-select] 検索結果: ${result.products.length}件 (${result.source})`);
    } catch (e: any) {
      console.error('[data-select] 検索エラー:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── 選択操作 ───
  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = allProducts.map(p => p.productId);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allIds])]);
    }
  }, [allProducts, selectedIds]);

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
          <span className={`text-xs px-2 py-1 rounded ${dataSource === 'smaregi' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {dataSource === 'smaregi' ? 'スマレジ連携中' : 'サンプルデータ'}
          </span>
          {hasSearched && (
            <span className="text-xs text-gray-500">
              検索結果: {allProducts.length}件
            </span>
          )}
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
                products={allProducts}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                isLoading={isLoading}
              />
            )}
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
