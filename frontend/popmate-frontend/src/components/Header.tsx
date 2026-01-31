'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary to-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
            <Image
              src="/popmate_icon_blue.png"
              alt="PopMate"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">PopMate</h1>
            <p className="text-xs text-white/80">ポップメイト</p>
          </div>
        </Link>

        {/* ナビゲーション */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-white/90 hover:text-white transition-colors">
            ホーム
          </a>
          <a href="#" className="text-white/90 hover:text-white transition-colors">
            使い方
          </a>
          <a href="#" className="text-white/90 hover:text-white transition-colors">
            お問い合わせ
          </a>
          <button className="bg-white text-primary px-4 py-2 rounded-full font-medium hover:bg-white/90 transition-colors">
            ログイン
          </button>
        </nav>

        {/* モバイルメニューボタン */}
        <button className="md:hidden p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
