import { RenderingCards } from './rendering-cards';
import { SSRTimestamp } from './ssr-timestamp';
import { Suspense } from 'react';

export default function RenderingDemoPage() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">渲染策略对比</h1>
        <p className="mb-8 text-gray-500">
          直观对比 SSR、SSG、ISR 在真实请求中的行为差异。刷新页面观察时间戳变化。
        </p>

        <Suspense fallback={<div className="animate-pulse h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />}>
          <SSRTimestamp />
        </Suspense>

        <RenderingCards />
      </div>
    </div>
  );
}
