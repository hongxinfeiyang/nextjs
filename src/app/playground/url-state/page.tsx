import { Suspense } from 'react';
import { ProductList } from './product-list';
import { FilterBar } from './filter-bar';
import { Pagination } from './pagination';

type Props = { searchParams: Promise<{ q?: string; category?: string; page?: string }> };

export default async function UrlStateDemoPage({ searchParams }: Props) {
  const { q = '', category = '', page = '1' } = await searchParams;
  const currentPage = Number(page) || 1;

  // 服务端根据 URL 参数筛选数据
  const all = [
    { id: '1', name: '机械键盘', category: '电子产品' },
    { id: '2', name: 'Type-C 数据线', category: '配件' },
    { id: '3', name: '显示器支架', category: '办公' },
    { id: '4', name: '无线鼠标', category: '电子产品' },
    { id: '5', name: '移动硬盘', category: '存储' },
    { id: '6', name: 'USB 集线器', category: '配件' },
    { id: '7', name: '台灯', category: '办公' },
    { id: '8', name: '耳机', category: '电子产品' },
    { id: '9', name: 'U盘 64GB', category: '存储' },
    { id: '10', name: '充电宝', category: '配件' },
  ];

  const filtered = all.filter(p =>
    (!q || p.name.includes(q)) && (!category || p.category === category),
  );

  const pageSize = 4;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold">URL 状态管理</h1>
        <p className="mb-8 text-gray-500">
          搜索、筛选、分页全部通过 URL 参数驱动。刷新页面、分享链接状态不丢失。
        </p>

        <Suspense fallback={<div className="h-10 animate-pulse rounded bg-gray-100" />}>
          <FilterBar />
        </Suspense>

        <div className="mt-4 rounded-xl border p-6">
          <p className="mb-3 text-xs text-gray-400">
            当前 URL 参数：q=&quot;{q}&quot; category=&quot;{category}&quot; page=&quot;{page}&quot;（服务端渲染）
          </p>
          <ProductList products={paged} />
        </div>

        <div className="mt-4">
          <Suspense fallback={null}>
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
