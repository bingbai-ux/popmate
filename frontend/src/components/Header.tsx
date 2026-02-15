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

        {/* 使い方リンク */}
        <div className="ml-auto">
          <Link
            href="/manual"
            className="flex items-center gap-1.5 text-blue-100 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            使い方
          </Link>
        </div>
      </div>
    </header>
  );
}
