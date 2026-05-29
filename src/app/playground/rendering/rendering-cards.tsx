import { RefreshButton } from './refresh-button';
import { ClientTimestamp } from './client-timestamp';

// 页面级 ISR：每 30 秒重新生成
export const revalidate = 30;

export async function RenderingCards() {
  // ISR 时间戳 — revalidate 期间的请求返回缓存
  const isrTime = new Date().toLocaleString('zh-CN');

  return (
    <div className="space-y-6">
      {/* ISR 卡片 */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <p className="mb-1 text-xs font-semibold text-green-600 uppercase">ISR — revalidate = 30</p>
        <p className="text-2xl font-mono font-bold">{isrTime}</p>
        <p className="mt-1 text-sm text-green-600/70 dark:text-green-400/70">
          30 秒内的请求返回缓存。30 秒后下一次请求触发后台重新生成。尝试在 30 秒内多次刷新——时间不变。
        </p>
      </div>

      {/* SSG 卡片 — 构建时生成 */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-950">
        <p className="mb-1 text-xs font-semibold text-purple-600 uppercase">SSG — generateStaticParams (默认)</p>
        <p className="text-2xl font-mono font-bold">构建时生成</p>
        <p className="mt-1 text-sm text-purple-600/70 dark:text-purple-400/70">
          此卡片在 <code className="rounded bg-purple-100 px-1 dark:bg-purple-900">next build</code> 时预渲染为静态 HTML，
          直接部署到 CDN。除非重新构建，内容永远不变。
        </p>
      </div>

      {/* CSR 卡片 */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950">
        <p className="mb-1 text-xs font-semibold text-orange-600 uppercase">CSR — &apos;use client&apos;</p>
        <p className="text-2xl font-mono font-bold">
          <ClientTimestamp />
        </p>
        <p className="mt-1 text-sm text-orange-600/70 dark:text-orange-400/70">
          时间在浏览器端渲染，每次组件挂载都会更新。
        </p>
      </div>

      <RefreshButton />
    </div>
  );
}
