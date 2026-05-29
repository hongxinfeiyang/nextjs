import Link from 'next/link';

export default function RoutingNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-gray-500">这个 ID 不存在（触发了 notFound()）</p>
      <Link href="/playground/routing" className="text-brand hover:underline">← 返回路由列表</Link>
    </div>
  );
}
