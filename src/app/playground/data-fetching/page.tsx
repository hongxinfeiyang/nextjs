import { Suspense } from 'react';
import { ServerDataList } from './server-data-list';
import { ClientSWRList } from './client-swr-list';
import { OptimisticDemo } from './optimistic-demo';

export default function DataFetchingDemoPage() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">数据获取</h1>
        <p className="mb-8 text-gray-500">
          对比服务端 fetch、SWR 客户端获取和乐观更新三种模式。
        </p>

        <div className="space-y-10">
          {/* 方式 1：Server Component fetch */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">方式一：Server Component + fetch</h2>
            <p className="mb-3 text-sm text-gray-500">数据在服务端获取，HTML 中直接包含内容（查看页面源代码可见）。</p>
            <Suspense fallback={<Skeleton />}>
              <ServerDataList />
            </Suspense>
          </section>

          {/* 方式 2：SWR 客户端获取 */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">方式二：SWR + 客户端轮询</h2>
            <p className="mb-3 text-sm text-gray-500">通过 SWR 每 10 秒自动后台刷新，切回标签页时也会刷新。</p>
            <ClientSWRList />
          </section>

          {/* 方式 3：乐观更新 */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">方式三：乐观更新（Optimistic Update）</h2>
            <p className="mb-3 text-sm text-gray-500">先更新 UI，再等待服务端确认。试试添加一个点赞。</p>
            <OptimisticDemo />
          </section>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border p-6">
      {[1,2,3].map(i => <div key={i} className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />)}
    </div>
  );
}
