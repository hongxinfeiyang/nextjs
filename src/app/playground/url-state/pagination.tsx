'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const go = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    replace(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => go(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-30"
      >
        上一页
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          onClick={() => go(i + 1)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            currentPage === i + 1 ? 'bg-brand text-white' : 'border hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => go(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-30"
      >
        下一页
      </button>
    </div>
  );
}
