import type { Metadata } from 'next';
import './globals.css';
import { getAllChapters } from '@/lib/chapters';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: {
    template: '%s — Next.js 学习指南',
    default: 'Next.js 从 0 到精通 — 全栈学习指南',
  },
  description: 'Next.js 15+ 全栈学习路线，包含路由、渲染、数据获取、认证、数据库、部署等 13 章详解',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const chapters = getAllChapters();

  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Sidebar chapters={chapters} />
        {/* 主内容区偏移，给侧边栏留空间 */}
        <main className="lg:ml-72">{children}</main>
      </body>
    </html>
  );
}
