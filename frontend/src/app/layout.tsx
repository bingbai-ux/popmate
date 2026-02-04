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
  // Google Fonts URL - すべてのフォントをプリロード
  const googleFontsUrl = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;500;700&family=M+PLUS+1p:wght@400;500;700&family=M+PLUS+Rounded+1c:wght@400;500;700&family=Kosugi&family=Kosugi+Maru&family=Sawarabi+Gothic&family=Sawarabi+Mincho&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Zen+Maru+Gothic:wght@400;500;700&family=Zen+Old+Mincho:wght@400;700&family=Shippori+Mincho:wght@400;500;700&family=Kiwi+Maru:wght@400;500&family=Hachi+Maru+Pop&family=Yusei+Magic&family=Dela+Gothic+One&family=Reggae+One&family=RocknRoll+One&family=Stick&family=DotGothic16&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Montserrat:wght@400;500;700&family=Poppins:wght@400;500;700&family=Inter:wght@400;500;700&family=Oswald:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Raleway:wght@400;500;700&family=Ubuntu:wght@400;500;700&family=Bebas+Neue&family=Anton&family=Abril+Fatface&family=Pacifico&family=Dancing+Script:wght@400;700&display=swap";

  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/popmate_icon_blue.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background-light">
        {children}
      </body>
    </html>
  );
}
