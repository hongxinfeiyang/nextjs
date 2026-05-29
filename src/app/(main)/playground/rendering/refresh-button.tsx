'use client';
import { useRouter } from 'next/navigation';

export function RefreshButton() {
  const router = useRouter();
  return (
    <div className="text-center">
      <button
        onClick={() => router.refresh()}
        className="rounded-lg bg-brand px-4 py-2 text-sm text-white font-medium hover:bg-brand-dark transition-colors"
      >
        手动刷新页面（router.refresh()）
      </button>
      <p className="mt-2 text-xs text-gray-400">
        对比刷新前后 ISR 时间戳是否变化——如果在 30 秒窗口内则不变
      </p>
    </div>
  );
}
