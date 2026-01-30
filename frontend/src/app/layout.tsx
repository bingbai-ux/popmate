import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ポップメイト - プライスポップ作成サービス',
  description: 'スマレジの商品データを使って、プロ品質のプライスポップを簡単作成',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
