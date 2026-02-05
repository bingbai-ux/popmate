import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const mdPath = process.argv[2];
if (!mdPath) {
  console.error('Usage: node md-to-pdf.mjs <markdown-file>');
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf-8');
const htmlContent = await marked(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ポップメイト 取り扱い説明書</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans JP', sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      font-size: 14px;
    }

    h1 {
      color: #0066CC;
      border-bottom: 3px solid #0066CC;
      padding-bottom: 10px;
      font-size: 28px;
      margin-top: 0;
    }

    h2 {
      color: #0066CC;
      border-left: 4px solid #0066CC;
      padding-left: 12px;
      margin-top: 40px;
      font-size: 20px;
    }

    h3 {
      color: #333;
      margin-top: 30px;
      font-size: 16px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 10px 12px;
      text-align: left;
    }

    th {
      background-color: #0066CC;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d63384;
    }

    pre {
      background-color: #f4f4f4;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 12px;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      color: #333;
    }

    blockquote {
      border-left: 4px solid #00CC66;
      margin: 20px 0;
      padding: 10px 20px;
      background-color: #f0fff4;
      color: #2d7a4d;
    }

    blockquote strong {
      color: #00CC66;
    }

    hr {
      border: none;
      border-top: 2px solid #eee;
      margin: 30px 0;
    }

    a {
      color: #0066CC;
      text-decoration: none;
    }

    ul, ol {
      padding-left: 25px;
    }

    li {
      margin: 5px 0;
    }

    @media print {
      body {
        padding: 20px;
      }

      h2 {
        page-break-before: auto;
      }

      table, pre, blockquote {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

const htmlPath = mdPath.replace(/\.md$/, '.html');
fs.writeFileSync(htmlPath, fullHtml);
console.log(`HTML saved: ${htmlPath}`);

// Convert to PDF using Playwright
const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome'
});
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'networkidle' });

const pdfPath = mdPath.replace(/\.md$/, '.pdf');
await page.pdf({
  path: pdfPath,
  format: 'A4',
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  },
  printBackground: true
});

await browser.close();
console.log(`PDF saved: ${pdfPath}`);
