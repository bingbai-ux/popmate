'use client';

import Link from 'next/link';

/** F&C Design System準拠ヘッダー: カード背景＋wasabiブランドピル */
export default function Header() {
  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center">
        {/* ブランドピル（ポータルと同じ様式） */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-7 w-7 place-items-center rounded-lg text-[15px] font-extrabold"
              style={{ background: '#D7EFFF', color: '#351E28' }}
            >
              P
            </span>
            <span className="text-[16px] font-extrabold tracking-wide" style={{ color: '#351E28' }}>
              POPMATE
            </span>
          </span>
          <span className="text-xs text-text-muted leading-tight hidden sm:inline">
            プライスポップ作成
          </span>
        </Link>

        {/* 使い方リンク */}
        <div className="ml-auto">
          <Link
            href="/manual"
            className="flex items-center gap-1.5 text-text-muted hover:text-text-dark transition-colors text-sm font-medium"
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
