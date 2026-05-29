export default function RoutingLoading() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <div className="animate-pulse rounded-xl border p-8 space-y-4">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <p className="mt-4 text-center text-sm text-gray-400">loading.tsx 骨架屏正在展示中...</p>
      </div>
    </div>
  );
}
