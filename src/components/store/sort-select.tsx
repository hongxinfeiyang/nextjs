/**
 * SortSelect 商品排序选择组件
 *
 * 属于商城模块（store）的商品筛选子组件。
 * 提供一个下拉选择框，用户可选择不同的排序方式（最新、价格升序/降序、名称排序）。
 * 排序状态通过 URL 查询参数（sort）管理，支持 URL 分享和浏览器前进/后退。
 * 切换排序方式时不会重置页码，保持当前页。
 *
 * @module components/store/sort-select
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * SortSelect 商品排序选择组件
 *
 * 使用原生 HTML select 元素实现排序选择。
 * 当前选中的排序方式从 URL 查询参数读取，变化时更新 URL。
 */
export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 商品列表页路由路径 */
  const pathname = '/shop/products';
  /** 从 URL 查询参数中读取当前排序方式，无则返回空字符串（表示默认排序） */
  const currentSort = searchParams.get('sort') || '';

  /**
   * 设置排序方式
   * 更新 URL 查询参数中的 sort
   *
   * @param sort - 排序方式标识，空字符串表示默认排序
   */
  const setSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    if (sort) {
      params.set('sort', sort);   // 设置排序参数
    } else {
      params.delete('sort');      // 默认排序时删除 sort 参数
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-700">排序</h3>
      <select
        value={currentSort}
        onChange={(e) => setSort(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        {/* 默认排序：最新（按创建时间倒序） */}
        <option value="">最新</option>
        {/* 价格从低到高 */}
        <option value="price_asc">价格从低到高</option>
        {/* 价格从高到低 */}
        <option value="price_desc">价格从高到低</option>
        {/* 按名称字母排序 */}
        <option value="name">名称排序</option>
      </select>
    </div>
  );
}
