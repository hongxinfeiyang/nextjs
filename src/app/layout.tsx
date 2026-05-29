import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s — Next.js 学习指南',
    default: 'Next.js 从 0 到精通 — 全栈学习指南',
  },
  description: 'Next.js 15+ 全栈学习路线，包含路由、渲染、数据获取、认证、数据库、部署等 13 章详解',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
