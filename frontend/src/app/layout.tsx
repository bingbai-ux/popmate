import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ポップメイト - プライスポップ作成サービス',
  description: 'スマレジの商品データを使って、プロ品質のプライスポップを簡単作成',
  icons: {
    icon: '/popmate_icon_blue.png',
    shortcut: '/popmate_icon_blue.png',
    apple: '/popmate_icon_blue.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/popmate_icon_blue.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-background-light">
        {children}
      </body>
    </html>
  );
}
