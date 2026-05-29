'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { useRef, useEffect } from 'react';
import { demoComponents } from '@/components/inline-demos';

interface MarkdownRendererProps {
  content: string;
}

// 预处理：把 :::demo name 块转成 <div data-demo="name" />
function preprocessDemoBlocks(md: string): string {
  // 匹配 :::demo name（可含连字符）块
  return md.replace(/^:::demo\s+([\w-]+)\s*$/gm, (_, name) => {
    if (demoComponents[name]) {
      return `<div data-demo="${name}"></div>`;
    }
    return `> 未知 demo: ${name}`;
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const proseRef = useRef<HTMLDivElement>(null);

  // TOC 链接平滑滚动
  useEffect(() => {
    const container = proseRef.current;
    if (!container) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href?.startsWith('#')) {
        e.preventDefault();
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, []);

  const processed = preprocessDemoBlocks(content);

  return (
    <div ref={proseRef} className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
        components={{
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} {...props}>
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto"><table>{children}</table></div>
          ),
          img: ({ src, alt, ...props }) => (
            <img src={src} alt={alt} loading="lazy" {...props} />
          ),
          // 捕获 data-demo 的 div，渲染为对应的 live demo 组件
          div: ({ children, ...props }: any) => {
            const demoName = props['data-demo'];
            if (demoName && demoComponents[demoName]) {
              const DemoComponent = demoComponents[demoName];
              return <DemoComponent />;
            }
            return <div {...props}>{children}</div>;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

// 提取页面内所有 h2 和 h3 作为目录
export function extractTOC(content: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: { level: number; text: string; id: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`~]|<!--.*?-->/g, '').trim();
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '');
    toc.push({ level, text, id });
  }
  return toc;
}
