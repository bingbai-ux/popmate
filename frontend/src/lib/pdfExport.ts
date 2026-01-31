// PDF出力ユーティリティ

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
 * 複数のポップ要素をPDFとして出力
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
      scale: 2,  // 高解像度
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
    gap?: number;  // mm
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
    const pageIndex = Math.floor(i / itemsPerPage);
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
  popWidth: number,  // mm
  popHeight: number, // mm
  options: Omit<PdfExportOptions, 'orientation' | 'pageSize'> = {}
): Promise<void> {
  const {
    filename = 'pop.pdf',
    quality = 0.95,
    margin = 0,
  } = options;

  // ポップサイズに合わせたPDFを作成
  const pdf = new jsPDF({
    orientation: popWidth > popHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [popWidth + margin * 2, popHeight + margin * 2],
  });

  // 要素をキャンバスに変換
  const canvas = await html2canvas(element, {
    scale: 3,  // 高解像度
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
