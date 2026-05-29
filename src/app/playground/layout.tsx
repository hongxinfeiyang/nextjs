import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Playground — Next.js 学习指南' };

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b px-6 py-3">
        <Link href="/playground" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand">
          <ArrowLeft size={16} /> Playground 首页
        </Link>
      </div>
      {children}
    </div>
  );
}
