/**
 * CategoryFilter 商品分类筛选组件
 *
 * 属于商城模块（store）的商品筛选子组件。
 * 渲染一个分类列表，用户点击某个分类后通过 URL 查询参数（category）筛选商品。
 * 包含"全部"按钮用于清除分类筛选，以及从 CATEGORIES 常量中读取的所有分类选项。
 * 当前选中的分类会高亮显示（蓝色背景），切换分类时自动将页码重置为第 1 页。
 *
 * @module components/store/category-filter
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';

/**
 * CategoryFilter 商品分类筛选组件
 *
 * 通过 URL 查询参数控制分类筛选状态，而非内部 React 状态。
 * 这样做的好处是分类筛选状态可以被 URL 分享和浏览器前进/后退支持。
 */
export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 商品列表页路由路径 */
  const pathname = '/shop/products';
  /** 从 URL 查询参数中读取当前选中的分类，无则返回空字符串 */
  const currentCategory = searchParams.get('category') || '';

  /**
   * 设置分类筛选
   * 更新 URL 查询参数中的 category，并重置页码为第 1 页
   *
   * @param category - 要设置的分類名称，传入空字符串表示清除筛选
   */
  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category); // 设置分类参数
    } else {
      params.delete('category');        // 空值时删除分类参数（显示全部）
    }
    params.set('page', '1');            // 切换分类时重置为第一页
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-700">分类</h3>
      <div className="space-y-1">
        {/* "全部"按钮：点击清除分类筛选 */}
        <button
          onClick={() => setCategory('')}
          className={cn(
            'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
            // 未选中任何分类时高亮"全部"按钮
            !currentCategory
              ? 'bg-blue-50 font-medium text-blue-600'
              : 'text-gray-600 hover:bg-gray-50',
          )}
        >
          全部
        </button>
        {/* 遍历 CATEGORIES 常量渲染所有分类按钮 */}
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
              // 当前选中的分类高亮为蓝色
              currentCategory === cat
                ? 'bg-blue-50 font-medium text-blue-600'
                : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
