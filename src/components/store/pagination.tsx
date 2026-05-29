/**
 * Pagination 分页导航组件
 *
 * 属于商城模块（store）的商品列表分页子组件。
 * 渲染上一页/下一页按钮和页码列表，支持跳转到指定页。
 * 页码显示逻辑：当总页数较多时，展示当前页附近的页码 + 首尾省略号，
 * 具体规则为当前页前后各显示 2 页，超出范围用 "..." 省略。
 * 分页状态通过 URL 查询参数（page）管理，第 1 页时不显示 page 参数。
 * 总页数 <= 1 时不渲染任何内容。
 *
 * @module components/store/pagination
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Pagination 组件的 Props 类型
 */
type PaginationProps = {
  /** 当前页码（从 1 开始） */
  page: number;
  /** 总页数 */
  totalPages: number;
};

/**
 * Pagination 分页导航组件
 *
 * 生成当前页前后各 2 页的页码范围，超出部分用省略号表示。
 * 例如：当前在第 5 页，总 20 页，则显示：1 ... 3 4 [5] 6 7 ... 20
 *
 * @param props - 分页属性
 */
export function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 商品列表页路由路径 */
  const pathname = '/shop/products';

  /**
   * 跳转到指定页码
   * 更新 URL 查询参数中的 page，第 1 页时删除 page 参数（保持 URL 简洁）
   *
   * @param p - 目标页码
   */
  const go = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p > 1) {
      params.set('page', String(p)); // 非第 1 页时设置 page 参数
    } else {
      params.delete('page');         // 第 1 页时删除 page 参数
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // 总页数不超过 1 时不渲染分页组件
  if (totalPages <= 1) return null;

  // 计算当前页附近的页码范围：前后各 2 页
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 上一页按钮：第 1 页时禁用 */}
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-30 hover:bg-gray-50"
      >
        上一页
      </button>

      {/* 如果页码列表起始大于 1，显示首页和省略号 */}
      {start > 1 && (
        <>
          <button
            onClick={() => go(1)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            1
          </button>
          {/* start > 2 时显示省略号，表示中间有跳过的页码 */}
          {start > 2 && <span className="px-1 text-gray-400">...</span>}
        </>
      )}

      {/* 当前页附近的页码列表 */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            // 当前页高亮：蓝色边框 + 蓝色背景
            p === page
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'hover:bg-gray-50',
          )}
        >
          {p}
        </button>
      ))}

      {/* 如果页码列表末尾小于总页数，显示省略号和末页 */}
      {end < totalPages && (
        <>
          {/* end < totalPages - 1 时显示省略号，表示中间有跳过的页码 */}
          {end < totalPages - 1 && (
            <span className="px-1 text-gray-400">...</span>
          )}
          <button
            onClick={() => go(totalPages)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* 下一页按钮：最后一页时禁用 */}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border px-3 py-2 text-sm disabled:opacity-30 hover:bg-gray-50"
      >
        下一页
      </button>
    </div>
  );
}
