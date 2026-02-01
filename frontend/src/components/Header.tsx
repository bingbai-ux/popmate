'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
        {/* ロゴのみ — ナビメニューは完全削除 */}
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
            <h1 className="text-lg font-bold leading-tight">PopMate</h1>
            <p className="text-xs text-blue-200 leading-tight">ポップメイト</p>
          </div>
        </Link>
        {/* ★ ホーム・使い方・お問い合わせ・ログイン → 全削除 */}
      </div>
    </header>
  );
}
