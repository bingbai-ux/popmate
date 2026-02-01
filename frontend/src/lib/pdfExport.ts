/**
 * PDF出力ユーティリティ
 * A4レイアウト対応、日本語フォント対策済み
 */

import type { LayoutResult, PaperSize } from './printLayout';

/**
 * PDF出力オプション
 */
export interface PdfExportOptions {
  filename?: string;
  quality?: number;       // 0.1 - 1.0
  margin?: number;        // mm
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

/**
 * A4レイアウトPDF出力用オプション
 */
export interface A4PdfExportOptions {
  filename?: string;
  quality?: number;
  paper: PaperSize;
  layout: LayoutResult;
  onProgress?: (current: number, total: number) => void;
}

/**
 * A4レイアウトのPDFを生成
 * 非表示のprint領域からキャプチャして生成
 */
export async function exportA4LayoutPdf(
  options: A4PdfExportOptions
): Promise<void> {
  const {
    filename = `popmate_${new Date().toISOString().slice(0, 10)}.pdf`,
    quality = 0.92,
    paper,
    layout,
    onProgress,
  } = options;

  // Dynamic import でSSRエラーを回避
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // フォントの読み込みを待機（日本語文字化け対策）
  await document.fonts.ready;

  // 非表示のprint領域からページを取得
  const pages = document.querySelectorAll<HTMLElement>('#print-pages-hidden .a4-print-page');
  
  if (pages.length === 0) {
    throw new Error('印刷用ページが見つかりません');
  }

  // PDFを作成
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paper.width, paper.height],
  });

  // 各ページをキャプチャしてPDFに追加
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // 進捗コールバック
    onProgress?.(i + 1, pages.length);

    // html2canvasでキャプチャ
    // 非表示要素のキャプチャのため、一時的に表示位置を調整
    const originalStyle = page.style.cssText;
    page.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      z-index: 99999 !important;
      background: white !important;
    `;

    // 少し待機してスタイル適用を確実にする
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(page, {
      scale: 2,  // 高解像度
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
    });

    // 元のスタイルに戻す
    page.style.cssText = originalStyle;

    // キャンバスを画像データに変換
    const imgData = canvas.toDataURL('image/jpeg', quality);

    // 2ページ目以降は新しいページを追加
    if (i > 0) {
      pdf.addPage([paper.width, paper.height]);
    }

    // 画像を追加（用紙全体に配置）
    pdf.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height);
  }

  // PDFをダウンロード
  pdf.save(filename);
}

/**
 * 複数のポップ要素をPDFとして出力（従来の方式）
 */
export async function exportToPdf(
  elements: HTMLElement[],
  options: PdfExportOptions = {}
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
  options: PdfExportOptions = {}
): Promise<void> {
  return exportToPdf([element], options);
}

/**
 * 複数のポップを1ページに並べてPDF出力（面付け）
 */
export async function exportMultiplePerPage(
  elements: HTMLElement[],
  options: PdfExportOptions & {
    columns?: number;
    rows?: number;
    gap?: number;
  } = {}
): Promise<void> {
  const {
    filename = 'pops.pdf',
    quality = 0.95,
    margin = 10,
    orientation = 'portrait',
    pageSize = 'a4',
    columns = 2,
    rows = 2,
    gap = 5,
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

  // 各セルのサイズを計算
  const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
  const cellHeight = (contentHeight - gap * (rows - 1)) / rows;
  const itemsPerPage = columns * rows;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const positionOnPage = i % itemsPerPage;
    const col = positionOnPage % columns;
    const row = Math.floor(positionOnPage / columns);

    // 新しいページが必要な場合
    if (positionOnPage === 0 && i > 0) {
      pdf.addPage();
    }

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
    const ratio = Math.min(cellWidth / imgWidth, cellHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // セル内で中央配置
    const cellX = margin + col * (cellWidth + gap);
    const cellY = margin + row * (cellHeight + gap);
    const x = cellX + (cellWidth - scaledWidth) / 2;
    const y = cellY + (cellHeight - scaledHeight) / 2;

    // 画像を追加
    pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);
  }

  // PDFをダウンロード
  pdf.save(filename);
}

/**
 * ポップサイズに合わせたPDF出力（実寸）
 */
export async function exportActualSize(
  element: HTMLElement,
  popWidth: number,
  popHeight: number,
  options: Omit<PdfExportOptions, 'orientation' | 'pageSize'> = {}
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
