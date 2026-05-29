import { notFound } from 'next/navigation';
import Link from 'next/link';

const knownIds = ['hello-world', 'getting-started', 'dynamic-routes'];

type Props = { params: Promise<{ id: string }> };

export default async function RoutingDetailPage({ params }: Props) {
  const { id } = await params;

  if (!knownIds.includes(id)) {
    notFound();
  }

  const titles: Record<string, string> = {
    'hello-world': 'Hello World — 第一个动态路由',
    'getting-started': '入门指南',
    'dynamic-routes': '深入动态路由',
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border p-8">
          <p className="mb-2 text-sm text-brand font-medium">动态路由参数</p>
          <p className="mb-1 text-sm text-gray-500">
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">params.id</code> = <strong>{id}</strong>
          </p>
          <h1 className="mb-4 text-3xl font-bold">{titles[id] || id}</h1>
          <p className="mb-6 text-gray-500">
            此页面由 <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">src/app/playground/routing/[id]/page.tsx</code> 渲染。
            路由参数 <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">id</code> 通过 <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">params</code> 异步获取。
          </p>
          <Link href="/playground/routing" className="text-sm text-brand hover:underline">
            ← 返回路由列表
          </Link>
        </div>
      </div>
    </div>
  );
}
