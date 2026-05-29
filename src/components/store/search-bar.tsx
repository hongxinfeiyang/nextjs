/**
 * SearchBar 搜索栏组件
 *
 * 属于商城模块（store）的商品筛选子组件。
 * 提供带防抖（debounce）的搜索输入框，用户在输入 300ms 停止后才触发 URL 查询参数更新。
 * 搜索时自动将页码重置为第 1 页，确保搜索结果从第一页开始展示。
 * 输入框清空时会删除 URL 中的 q 参数，恢复显示全部商品。
 *
 * @module components/store/search-bar
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

/**
 * SearchBar 搜索栏组件
 *
 * 使用受控输入 + 防抖的组合模式：
 * - value 状态即时响应用户输入，保证输入流畅
 * - debouncedValue 在 300ms 无输入后才更新，避免频繁触发路由
 * - URL 查询参数同步由 useEffect 监听 debouncedValue 变化驱动
 */
export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** 商品列表页的路由路径 */
  const pathname = '/shop/products';
  /** 输入框的即时值，初始化为 URL 中已有的 q 参数 */
  const [value, setValue] = useState(searchParams.get('q') || '');
  /** 防抖后的搜索值，300ms 延迟 */
  const debouncedValue = useDebounce(value, 300);

  // 监听防抖值变化，同步更新 URL 查询参数
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedValue) {
      params.set('q', debouncedValue);   // 设置搜索关键词
    } else {
      params.delete('q');                // 关键词为空时删除 q 参数
    }
    params.set('page', '1');             // 搜索时重置为第一页
    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedValue]);

  return (
    <div className="relative">
      {/* 搜索图标：绝对定位在输入框左侧 */}
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="搜索商品..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        // 左侧留出图标空间（pl-10），聚焦时蓝色边框 + 环形阴影
        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
