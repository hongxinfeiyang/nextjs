// SSR 时间戳（动态 — 每次请求都生成新时间）
export async function SSRTimestamp() {
  const now = new Date().toLocaleString('zh-CN');
  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
      <p className="mb-1 text-xs font-semibold text-blue-500 uppercase">SSR — dynamic=&apos;force-dynamic&apos;</p>
      <p className="text-2xl font-mono font-bold">{now}</p>
      <p className="mt-1 text-sm text-blue-600/70 dark:text-blue-400/70">
        每次刷新页面，时间都会变——因为这是服务端动态渲染。
      </p>
    </div>
  );
}
