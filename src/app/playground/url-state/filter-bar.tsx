'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

// 内联 debounce 避免额外依赖
function useDebounce(cb: Function, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => cb(...args), ms);
  };
}

export function FilterBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
  };

  const debouncedSearch = useDebounce((v: string) => update('q', v), 300);

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="搜索..."
        defaultValue={searchParams.get('q') || ''}
        onChange={e => debouncedSearch(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm w-48"
      />
      <select
        value={searchParams.get('category') || ''}
        onChange={e => update('category', e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm"
      >
        <option value="">全部分类</option>
        {['电子产品', '配件', '办公', '存储'].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {(searchParams.get('q') || searchParams.get('category')) && (
        <button
          onClick={() => replace(pathname)}
          className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
