/**
 * 商品列表页 — /shop/products
 *
 * 职责：
 * - 展示全部已发布商品，支持搜索、分类筛选、排序和分页
 * - 左侧边栏提供分类筛选和排序控件（桌面端），移动端顶部显示搜索栏
 * - 作为服务端组件，根据 URL 查询参数动态构建数据库查询条件
 *
 * URL 查询参数：
 * - q:        搜索关键词，匹配商品名称（模糊搜索）
 * - category: 分类筛选，精确匹配
 * - sort:     排序方式（price_asc / price_desc / name）
 * - page:     当前页码，默认第 1 页
 *
 * 数据获取策略：
 * - 使用 Promise.all 并行查询商品列表、总数和分类列表，减少往返延迟
 * - 查询参数映射：URL 参数 -> Prisma where/orderBy 条件，实现安全的数据过滤
 */

import { Suspense } from 'react';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/store/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { SearchBar } from '@/components/store/search-bar';
import { CategoryFilter } from '@/components/store/category-filter';
import { SortSelect } from '@/components/store/sort-select';
import { Pagination } from '@/components/store/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PAGE_SIZE } from '@/lib/constants';

/** 页面元数据 */
export const metadata = { title: '全部商品' };

/**
 * 解析数据库中 JSON 字符串格式的图片数据
 * @param images - JSON 字符串
 * @returns 图片 URL 数组，解析失败返回空数组
 */
function parseImages(images: string): string[] {
  try { return JSON.parse(images); } catch { return []; }
}

/**
 * ProductGridSkeleton — 商品网格加载骨架屏
 *
 * 在 Suspense 边界内渲染，数据加载期间展示 8 个占位卡片，
 * 减少布局偏移（CLS），提升感知性能
 */
function ProductGridSkeleton() {
  return (
    <ProductGrid>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          {/* 图片占位 */}
          <Skeleton className="aspect-square w-full" />
          {/* 标题占位（宽 2/3） */}
          <Skeleton className="h-4 w-2/3" />
          {/* 价格占位（宽 1/3） */}
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </ProductGrid>
  );
}

/** 页面 Props：searchParams 为 Next.js 15+ 的异步 Promise 类型 */
type Props = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
};

/**
 * ProductsPage — 商品列表页（服务端组件）
 *
 * 根据 URL 查询参数构建数据库查询，支持：
 * - 关键词搜索（name contains 模糊匹配）
 * - 分类筛选（category 精确匹配）
 * - 多维度排序（价格升/降序、名称升序、默认按创建时间降序）
 * - 分页浏览（通过 skip/take 实现偏移分页）
 *
 * @param searchParams - Next.js 提供的异步查询参数 Promise
 */
export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { q, category, sort, page = '1' } = sp;

  // 构建 Prisma where 条件：仅查询已发布商品
  const where: Record<string, unknown> = { published: true };
  if (q) where.name = { contains: q }; // 名称模糊搜索
  if (category) where.category = category; // 分类精确匹配

  // 构建排序条件：默认为创建时间降序
  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'name') orderBy = { name: 'asc' };

  // 页码安全处理：至少为 1
  const currentPage = Math.max(1, Number(page) || 1);

  // 并行查询：商品列表 + 总数（用于分页）+ 可用的分类列表（用于左侧筛选栏）
  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * PAGE_SIZE, // 偏移量计算
      take: PAGE_SIZE, // 每页数量
    }),
    db.product.count({ where }), // 符合当前筛选条件的商品总数
    db.product.findMany({
      select: { category: true },
      distinct: ['category'], // 去重获取所有分类名称
      where: { published: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE); // 总页数

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">全部商品</h1>

      <div className="flex gap-8">
        {/* 左侧边栏（桌面端可见）：分类筛选 + 排序选择 */}
        <aside className="hidden w-56 shrink-0 space-y-8 lg:block">
          <CategoryFilter />
          <SortSelect />
        </aside>

        <main className="flex-1">
          {/* 移动端顶部搜索栏（桌面端在 header 中已提供搜索入口） */}
          <div className="mb-6 lg:hidden">
            <SearchBar />
          </div>

          {/* Suspense 包裹商品列表，加载时显示骨架屏 */}
          <Suspense fallback={<ProductGridSkeleton />}>
            {products.length === 0 ? (
              // 无结果时显示空状态提示
              <EmptyState
                title="没有找到商品"
                description="试试其他关键词或筛选条件"
                actionLabel="查看全部商品"
                actionHref="/shop/products"
              />
            ) : (
              <>
                {/* 搜索结果摘要信息 */}
                <p className="mb-4 text-sm text-gray-500">
                  共 {total} 件商品
                  {q && <span> — 搜索 &quot;{q}&quot;</span>}
                  {category && <span> — {category}</span>}
                </p>
                <ProductGrid>
                  {products.map((p) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      price={p.price}
                      comparePrice={p.comparePrice}
                      image={parseImages(p.images)[0]}
                      category={p.category}
                      stock={p.stock}
                    />
                  ))}
                </ProductGrid>
                {/* 分页控件：仅在有多页时显示 */}
                <div className="mt-8">
                  <Pagination page={currentPage} totalPages={totalPages} />
                </div>
              </>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
