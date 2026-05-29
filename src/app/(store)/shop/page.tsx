/**
 * 商城首页 — (store)/shop 路由组入口页面
 *
 * 职责：
 * - 作为商城的主入口页面（/shop），展示商城核心内容
 * - 渲染 Hero 横幅区、商品分类导航、推荐商品、新品上市四个区块
 * - 通过服务端组件（Server Component）直接从数据库获取数据，无需客户端请求
 *
 * 数据获取：
 * - 并行查询推荐商品（featured=true）和最新商品（按创建时间降序），优化加载性能
 * - 使用 Promise.all 并发执行两个数据库查询
 */

import Link from 'next/link';
import { db } from '@/lib/db';
import { ProductCard } from '@/components/store/product-card';
import { ProductGrid } from '@/components/store/product-grid';
import { CATEGORIES } from '@/lib/constants';

/** 页面元数据（SEO 标题），由 Next.js App Router 自动识别 */
export const metadata = {
  title: 'ShopNext — 在线商城',
};

/**
 * 解析数据库中 JSON 字符串格式的图片数据
 *
 * 数据库中 images 字段以 JSON 数组字符串存储，如 '["url1","url2"]'
 * 此函数将其解析为字符串数组，解析失败时返回空数组以保安全
 *
 * @param images - 数据库中的 JSON 字符串
 * @returns 图片 URL 数组
 */
function parseImages(images: string): string[] {
  try {
    return JSON.parse(images);
  } catch {
    return []; // 解析失败时返回空数组，避免页面崩溃
  }
}

/**
 * ShopHomePage — 商城首页（服务端组件）
 *
 * 并行获取推荐商品和最新商品，渲染首页的 Hero、分类、推荐和新品四个板块。
 * 作为 async Server Component，数据在服务端获取完成后才渲染 HTML 返回客户端。
 */
export default async function ShopHomePage() {
  // 并行查询两组商品数据，减少总等待时间
  const [featuredProducts, newProducts] = await Promise.all([
    db.product.findMany({
      where: { published: true, featured: true }, // 仅已发布且标记为推荐
      take: 8, // 最多展示 8 件
      orderBy: { createdAt: 'desc' },
    }),
    db.product.findMany({
      where: { published: true }, // 所有已发布商品
      take: 8,
      orderBy: { createdAt: 'desc' }, // 按创建时间降序 = 最新优先
    }),
  ]);

  return (
    <div>
      {/* ========== Hero 横幅区 ========== */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            ShopNext 在线商城
          </h1>
          <p className="mb-8 text-lg text-gray-500">
            精选好物，品质生活
          </p>
          <Link
            href="/shop/products"
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            浏览全部商品
          </Link>
        </div>
      </section>

      {/* ========== 商品分类导航区 ========== */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">商品分类</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/shop/products?category=${cat}`} // 点击跳转至带分类筛选的商品列表页
              className="rounded-xl border border-gray-200 p-6 text-center hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* 根据分类名称显示对应 emoji 图标 */}
              <span className="text-3xl">
                {cat === '电子产品' ? '💻' :
                 cat === '服装' ? '👔' :
                 cat === '家居' ? '🏠' :
                 cat === '运动' ? '⚽' : '📚'}
              </span>
              <p className="mt-2 font-medium">{cat}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== 推荐商品区 ========== */}
      {/* 仅在有推荐商品时才渲染，避免空区块 */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">推荐商品</h2>
            <Link href="/shop/products" className="text-sm text-blue-600 hover:underline">
              查看全部 →
            </Link>
          </div>
          <ProductGrid>
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                comparePrice={p.comparePrice}
                image={parseImages(p.images)[0]} // 取第一张图片作为封面
                category={p.category}
                stock={p.stock}
              />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* ========== 新品上市区 ========== */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">新品上市</h2>
          <Link href="/shop/products" className="text-sm text-blue-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        <ProductGrid>
          {newProducts.map((p) => (
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
      </section>
    </div>
  );
}
