'use client';

import { EditorElement, TemplateConfig, TaxSettings } from '@/types/editor';
import { Product } from '@/types/product';
import PreviewCanvas from './PreviewCanvas';

interface PrintPreviewModalProps {
  template: TemplateConfig;
  elements: EditorElement[];
  products: Product[];
  taxSettings: TaxSettings;
  onClose: () => void;
}

export default function PrintPreviewModal({
  template,
  elements,
  products,
  taxSettings,
  onClose,
}: PrintPreviewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg">印刷プレビュー</h3>
            <p className="text-sm text-gray-500">{products.length}件の商品ポップ</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              印刷
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* プレビューエリア */}
        <div className="flex-1 overflow-auto p-6 space-y-8 print-area">
          {products.map((product, index) => (
            <div key={product.productId} className="break-inside-avoid">
              <div className="text-sm text-gray-500 mb-2 font-medium">
                {index + 1}/{products.length}　{product.productName}
              </div>
              <PreviewCanvas
                template={template}
                elements={elements}
                product={product}
                taxSettings={taxSettings}
                zoom={1}
              />
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="border-t border-border p-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            印刷する
          </button>
        </div>
      </div>
    </div>
  );
}
