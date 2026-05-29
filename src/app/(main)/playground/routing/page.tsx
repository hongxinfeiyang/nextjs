import Link from 'next/link';

export default function RoutingDemoPage() {
  const slugs = ['hello-world', 'getting-started', 'dynamic-routes'];

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold">动态路由演示</h1>
        <p className="mb-8 text-gray-500">
          演示 <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">[id]</code> 动态段、
          <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">generateStaticParams</code>、
          <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">loading.tsx</code> 和
          <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">notFound()</code>。
        </p>

        <div className="rounded-xl border p-6 space-y-4">
          <p className="font-medium">点击以下链接访问动态路由：</p>
          <div className="flex flex-wrap gap-3">
            {slugs.map(s => (
              <Link
                key={s}
                href={`/playground/routing/${s}`}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-brand hover:text-white transition-colors dark:bg-gray-800"
              >
                /playground/routing/{s}
              </Link>
            ))}
            <Link
              href="/playground/routing/not-exist"
              className="rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors dark:bg-red-950"
            >
              测试 404
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-xl border p-6">
          <h3 className="mb-3 font-semibold">路由结构</h3>
          <pre className="rounded-lg bg-gray-50 p-4 text-xs leading-relaxed dark:bg-gray-900">
{`src/app/playground/routing/
├── page.tsx            ← 当前页：路由列表
└── [id]/
    ├── page.tsx        ← 动态路由：/playground/routing/:id
    ├── loading.tsx     ← 加载骨架屏（Suspense fallback）
    └── not-found.tsx   ← 不存在 ID 时的 404 页面`}
          </pre>
        </div>
      </div>
    </div>
  );
}
