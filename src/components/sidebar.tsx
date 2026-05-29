'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { ChapterMeta } from '@/lib/chapters';

export function Sidebar({ chapters }: { chapters: ChapterMeta[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border p-2 lg:hidden sidebar"
        onClick={() => setOpen(!open)}
        aria-label="切换菜单"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <BookOpen size={24} className="text-brand shrink-0" />
            <span className="text-lg font-bold">Next.js 学习指南</span>
          </Link>
        </div>

        <nav className="px-4 pb-8">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            章节目录
          </p>
          <ul className="space-y-0.5">
            {chapters.map(ch => {
              const isActive = pathname === `/chapters/${ch.slug}`;

              return (
                <li key={ch.slug}>
                  <Link
                    href={`/chapters/${ch.slug}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-brand/10 text-brand font-medium'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2 text-xs text-gray-400">{ch.number}</span>
                    {ch.title}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mb-3 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            实战项目
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith('/shop') || pathname.startsWith('/login') || pathname.startsWith('/admin')
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-2 text-xs text-gray-400">Shop</span>
                ShopNext 商城
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-2 text-xs text-gray-400">Admin</span>
                管理后台
              </Link>
            </li>
          </ul>

          <p className="mb-3 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            交互演示
          </p>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/playground"
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith('/playground')
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="mr-2 text-xs text-gray-400">Demo</span>
                Playground
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
