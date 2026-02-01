/**
 * PDF出力ユーティリティ
 * A4レイアウト対応、日本語フォント対策済み
 * 
 * 方式: 画面のA4ページ要素を一時的に実寸に拡大してキャプチャ
 */

/**
 * PDF出力オプション
 */
export interface PdfExportOptions {
  filename?: string;
  quality?: number;       // 0.1 - 1.0
  onProgress?: (current: number, total: number) => void;
}

/**
 * A4レイアウトのPDFを生成
 * #print-area 内のA4ページ要素をキャプチャ
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

  // #print-area 内のA4ページを取得
  const printArea = document.getElementById('print-area');
  if (!printArea) {
    throw new Error('印刷領域が見つかりません');
  }

  const pages = printArea.querySelectorAll<HTMLElement>('.a4-page');
  if (pages.length === 0) {
    throw new Error('印刷用ページが見つかりません');
  }

  // A4サイズ（mm）
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // PDFを作成
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A4_WIDTH_MM, A4_HEIGHT_MM],
  });

  // 各ページをキャプチャしてPDFに追加
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // 進捗コールバック
    onProgress?.(i + 1, pages.length);

    // 元のスタイルを保存
    const originalStyle = page.style.cssText;
    const originalClass = page.className;

    // 一時的に実寸表示に変更
    page.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      z-index: 99999 !important;
      background: white !important;
      transform: none !important;
      display: block !important;
      visibility: visible !important;
    `;
    page.className = 'a4-page';

    // 少し待機してスタイル適用を確実にする
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      // html2canvasでキャプチャ
      // 高解像度でキャプチャ（scale: 2 = 300dpi相当）
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        width: A4_WIDTH_MM * 3.7795, // mm to px (96dpi)
        height: A4_HEIGHT_MM * 3.7795,
        windowWidth: A4_WIDTH_MM * 3.7795,
        windowHeight: A4_HEIGHT_MM * 3.7795,
      });

      // キャンバスを画像データに変換
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // 2ページ目以降は新しいページを追加
      if (i > 0) {
        pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM]);
      }

      // 画像を追加（用紙全体に配置）
      pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    } finally {
      // 元のスタイルに戻す
      page.style.cssText = originalStyle;
      page.className = originalClass;
    }
  }

  // PDFをダウンロード
  pdf.save(filename);
}

/**
 * 従来の方式: 複数のポップ要素をPDFとして出力
 */
export async function exportToPdf(
  elements: HTMLElement[],
  options: {
    filename?: string;
    quality?: number;
    margin?: number;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'a3' | 'letter';
  } = {}
): Promise<void> {
  const {
    filename = 'pops.pdf',
    quality = 0.95,
    margin = 10,
    orientation = 'portrait',
    pageSize = 'a4',
  } = options;

  // Dynamic import でSSRエラーを回避
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // フォントの読み込みを待機
  await document.fonts.ready;

  // PDFを作成
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // 要素をキャンバスに変換
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // キャンバスを画像データに変換
    const imgData = canvas.toDataURL('image/jpeg', quality);

    // アスペクト比を維持してサイズを計算
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // 中央配置
    const x = margin + (contentWidth - scaledWidth) / 2;
    const y = margin + (contentHeight - scaledHeight) / 2;

    // 2ページ目以降は新しいページを追加
    if (i > 0) {
      pdf.addPage();
    }

    // 画像を追加
    pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);
  }

  // PDFをダウンロード
  pdf.save(filename);
}

/**
 * 単一のポップ要素をPDFとして出力
 */
export async function exportSingleToPdf(
  element: HTMLElement,
  options: {
    filename?: string;
    quality?: number;
    margin?: number;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'a3' | 'letter';
  } = {}
): Promise<void> {
  return exportToPdf([element], options);
}

/**
 * ポップサイズに合わせたPDF出力（実寸）
 */
export async function exportActualSize(
  element: HTMLElement,
  popWidth: number,
  popHeight: number,
  options: {
    filename?: string;
    quality?: number;
    margin?: number;
  } = {}
): Promise<void> {
  const {
    filename = 'pop.pdf',
    quality = 0.95,
    margin = 0,
  } = options;

  // Dynamic import でSSRエラーを回避
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // フォントの読み込みを待機
  await document.fonts.ready;

  // ポップサイズに合わせたPDFを作成
  const pdf = new jsPDF({
    orientation: popWidth > popHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [popWidth + margin * 2, popHeight + margin * 2],
  });

  // 要素をキャンバスに変換
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // キャンバスを画像データに変換
  const imgData = canvas.toDataURL('image/jpeg', quality);

  // 画像を追加
  pdf.addImage(imgData, 'JPEG', margin, margin, popWidth, popHeight);

  // PDFをダウンロード
  pdf.save(filename);
}
