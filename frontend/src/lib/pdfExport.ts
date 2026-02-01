/**
 * PDF出力ユーティリティ
 * 
 * 方式: 画面上のA4ページ要素の transform を一時解除してキャプチャ
 * ★ display: none は一切使わない
 */

export interface PdfExportOptions {
  filename?: string;
  quality?: number;       // 0.1 - 1.0
  onProgress?: (current: number, total: number) => void;
}

/**
 * A4レイアウトのPDFを生成
 * #print-pages 内のA4ページ要素をキャプチャ
 */
export async function exportA4PDF(
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    filename = `popmate_${new Date().toISOString().slice(0, 10)}.pdf`,
    quality = 0.92,
    onProgress,
  } = options;

  // Dynamic import でSSRエラーを回避
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // フォントの読み込みを待機（日本語文字化け対策）
  await document.fonts.ready;

  // ★ #print-pages 内のA4ページを取得（display: none ではない）
  const printPages = document.getElementById('print-pages');
  if (!printPages) {
    throw new Error('印刷ページコンテナ (#print-pages) が見つかりません');
  }

  const pages = printPages.querySelectorAll<HTMLElement>('.a4-page');
  if (pages.length === 0) {
    throw new Error('印刷用ページ (.a4-page) が見つかりません');
  }

  // A4サイズ（mm）
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  // mm → px 変換係数 (96dpi)
  const MM_TO_PX = 3.7795;

  // PDFを作成
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A4_WIDTH_MM, A4_HEIGHT_MM],
  });

  // ★ 全ページの元のスタイルを保存
  const originalStyles: Array<{
    cssText: string;
    className: string;
  }> = [];

  // ★ まず全ページを実寸表示に変更
  pages.forEach((page, i) => {
    originalStyles.push({
      cssText: page.style.cssText,
      className: page.className,
    });

    // transform を解除し、実寸で表示
    page.style.transform = 'none';
    page.style.transformOrigin = 'top left';
    page.style.margin = '0';
    page.style.marginBottom = '0';
    page.style.boxShadow = 'none';
    page.style.position = 'relative';
    page.style.width = `${A4_WIDTH_MM}mm`;
    page.style.height = `${A4_HEIGHT_MM}mm`;

    // hidden-page を一時的に解除（visibility: visible にする）
    if (page.classList.contains('hidden-page')) {
      page.classList.remove('hidden-page');
      page.style.visibility = 'visible';
      page.style.height = `${A4_HEIGHT_MM}mm`;
      page.style.overflow = 'visible';
      page.dataset.wasHidden = 'true';
    }
  });

  // ★ レイアウト再計算を確実に待機
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 200));

  try {
    // 各ページをキャプチャしてPDFに追加
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // 進捗コールバック
      onProgress?.(i + 1, pages.length);

      // ★ html2canvas でキャプチャ
      const canvas = await html2canvas(page, {
        scale: 2,                              // 150dpi相当
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        width: Math.round(A4_WIDTH_MM * MM_TO_PX),
        height: Math.round(A4_HEIGHT_MM * MM_TO_PX),
        windowWidth: Math.round(A4_WIDTH_MM * MM_TO_PX),
        windowHeight: Math.round(A4_HEIGHT_MM * MM_TO_PX),
        // ★ 要素の実際の位置・サイズを使用
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      // キャンバスを画像データに変換
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // 2ページ目以降は新しいページを追加
      if (i > 0) {
        pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM]);
      }

      // 画像を追加（用紙全体に配置）
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    }
  } finally {
    // ★ 全ページの元のスタイルを復元
    pages.forEach((page, i) => {
      const original = originalStyles[i];
      if (original) {
        page.style.cssText = original.cssText;
        page.className = original.className;
      }
      // data属性を削除
      delete page.dataset.wasHidden;
    });
  }

  // PDFをダウンロード
  pdf.save(filename);
}
