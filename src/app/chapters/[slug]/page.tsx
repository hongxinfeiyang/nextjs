import { getAllChapters, getChapterContent, extractTOC } from '@/lib/chapters';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

// 构建时生成所有静态页面
export function generateStaticParams() {
  const chapters = getAllChapters();
  return chapters.map(ch => ({ slug: ch.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = getChapterContent(slug);
  if (!content) return { title: '章节未找到' };

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  return { title, description: content.slice(0, 160).replace(/[#*`>|-]/g, '').trim() };
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const content = getChapterContent(slug);

  if (!content) {
    notFound();
  }

  const chapters = getAllChapters();
  const currentIndex = chapters.findIndex(ch => ch.slug === slug);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // 提取文档标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const docTitle = titleMatch ? titleMatch[1].trim() : '';

  // 提取 TOC（h2 和 h3）
  const toc = extractTOC(content);

  // 去掉第一行 h1 标题（因为页面顶部已经渲染标题）
  const bodyContent = content.replace(/^#\s+.+\n?/, '');

  return (
    <div className="min-h-screen">
      {/* 文章内容区 */}
      <div className="flex">
        {/* 主内容 */}
        <article className="min-w-0 flex-1 px-6 py-10 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {/* 章节编号 */}
            {chapters[currentIndex] && (
              <p className="mb-2 text-sm font-medium text-brand">
                第 {chapters[currentIndex].number} 章
              </p>
            )}

            {/* 标题 */}
            <h1 className="mb-8 text-3xl font-extrabold lg:text-4xl">
              {docTitle}
            </h1>

            {/* Markdown 内容 */}
            <MarkdownRenderer content={bodyContent} />

            {/* 上下章导航 */}
            <div className="mt-16 flex items-center justify-between border-t pt-8">
              {prev ? (
                <Link
                  href={`/chapters/${prev.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand transition-colors"
                >
                  <ChevronLeft size={18} />
                  <div>
                    <span className="block text-xs text-gray-400">上一章</span>
                    <span>{prev.title}</span>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/chapters/${next.slug}`}
                  className="flex items-center gap-2 text-right text-sm font-medium text-gray-500 hover:text-brand transition-colors"
                >
                  <div>
                    <span className="block text-xs text-gray-400">下一章</span>
                    <span>{next.title}</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </article>

        {/* 右侧 TOC — 桌面端固定 */}
        {toc.length > 0 && (
          <aside className="hidden w-56 shrink-0 border-l xl:block">
            <div className="sticky top-0 max-h-screen overflow-y-auto p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                本节目录
              </p>
              <nav>
                <ul className="space-y-1">
                  {toc.map(item => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`toc-link block text-xs py-0.5 ${
                          item.level === 3 ? 'pl-3' : ''
                        } text-gray-500`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
