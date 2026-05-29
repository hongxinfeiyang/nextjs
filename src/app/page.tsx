import { getAllChapters } from '@/lib/chapters';
import Link from 'next/link';
import { ArrowRight, BookOpen, Code2, Rocket } from 'lucide-react';

export default function HomePage() {
  const chapters = getAllChapters();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-brand">
            <BookOpen size={18} />
            <span>Next.js 15+ · App Router · React 19</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Next.js 从 0 到精通
          </h1>
          <p className="mb-8 text-lg text-gray-500 dark:text-gray-400">
            覆盖路由、渲染策略、数据获取、Server Actions、认证、数据库、性能优化、测试等 13 个核心主题的全栈学习指南。
            每个章节包含详细讲解、完整代码示例和练习题。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/chapters/${chapters[0]?.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-white font-medium hover:bg-brand-dark transition-colors"
            >
              开始学习 <ArrowRight size={18} />
            </Link>
            <Link
              href={`/chapters/${chapters[chapters.length - 1]?.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              实战项目
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Rocket size={18} /> Playground
            </Link>
          </div>
        </div>
      </section>

      {/* 特色标签 */}
      <section className="border-b px-6 py-10 lg:px-12">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { icon: Code2, title: '代码驱动', desc: '每个知识点都配有可运行代码，在实战中理解概念' },
            { icon: BookOpen, title: '系统全面', desc: '从环境搭建到生产部署，13 章覆盖全栈开发周期' },
            { icon: Rocket, title: '实战导向', desc: '最后一章构建完整的电商平台，融会贯通所有知识' },
          ].map(f => (
            <div key={f.title} className="flex flex-col gap-2">
              <f.icon size={28} className="text-brand" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 章节目录 */}
      <section className="px-6 py-10 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-2xl font-bold">章节目录</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map(ch => (
              <Link
                key={ch.slug}
                href={`/chapters/${ch.slug}`}
                className="group rounded-lg border p-4 transition-all hover:border-brand hover:shadow-sm"
              >
                <span className="mb-1 block text-xs font-medium text-brand">
                  第 {ch.number} 章
                </span>
                <span className="font-semibold group-hover:text-brand transition-colors">
                  {ch.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-gray-400">
        <p>基于 Next.js 15+ 编写 · 持续更新中</p>
      </footer>
    </div>
  );
}
