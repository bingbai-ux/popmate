import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ポップメイト - プライスポップ作成サービス',
  description: 'スマレジと連携してプライスポップを簡単に作成できるサービス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
