import { CounterDemo } from './counter-demo';

export default function CounterDemoPage() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold">计数器 & 客户端交互</h1>
        <p className="mb-8 text-gray-500">
          演示 <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">useState</code>、
          <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">useEffect</code> 和
          <code className="rounded bg-gray-100 px-1 text-sm dark:bg-gray-800">&apos;use client&apos;</code> 边界。
        </p>
        <CounterDemo />
      </div>
    </div>
  );
}
