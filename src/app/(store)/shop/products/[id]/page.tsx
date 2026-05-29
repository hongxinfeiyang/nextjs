/**
 * 商品详情页 — /shop/products/[id]
 *
 * 职责：
 * - 展示单个商品的完整信息：图片、名称、价格、描述、库存状态、用户评价
 * - 提供加入购物车操作
 * - 未发布或不存在商品时自动返回 404
 *
 * 动态路由参数：
 * - id: 商品的唯一标识符（数据库主键）
 *
 * 数据获取：
 * - 通过 Prisma findUnique + include 一次性获取商品、评价和评价用户信息，避免 N+1 查询
 * - 使用 generateMetadata 动态生成 SEO 元数据（标题和描述）
 *
 * ISR 策略：
 * - revalidate = 3600 秒，页面在服务端缓存 1 小时后重新生成，兼顾性能和内容新鲜度
 */

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import type { Metadata } from 'next';

/**
 * 解析数据库中 JSON 字符串格式的图片数据
 * @param images - JSON 字符串
 * @returns 图片 URL 数组
 */
function parseImages(images: string): string[] {
  try { return JSON.parse(images); } catch { return []; }
}

/** 页面 Props */
type Props = { params: Promise<{ id: string }> };

/**
 * 动态生成页面元数据（SEO）
 *
 * 根据商品 ID 从数据库查询商品名称和描述，
 * 用于设置浏览器标签页标题和搜索引擎摘要
 *
 * @param params - 动态路由参数（异步 Promise）
 * @returns SEO 元数据对象
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { title: '商品不存在' };
  return {
    title: product.name,
    description: product.description.slice(0, 160), // 截取前 160 字符作为描述
  };
}

/**
 * ISR 缓存周期（秒）
 * 页面渲染后缓存 1 小时，过期后下次请求触发后台重新生成
 */
export const revalidate = 3600;

/**
 * ProductPage — 商品详情页（服务端组件）
 *
 * 展示商品完整信息，包括：
 * - 商品图片列表（支持多图）
 * - 分类标签、名称、价格（含划线原价）
 * - 库存状态（有货 / 缺货）
 * - 加入购物车按钮（客户端交互组件）
 * - 用户评价列表（评分 + 评论文本）
 *
 * 若商品不存在或未发布，调用 notFound() 跳转 Next.js 404 页面
 *
 * @param params - 动态路由参数
 */
export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  // 一次性查询商品及关联数据：评价列表（含用户信息）+ 评价总数
  const product = await db.product.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: { select: { name: true, image: true } } }, // 仅获取评价用户的名称和头像
        orderBy: { createdAt: 'desc' }, // 最新评价在前
        take: 10, // 最多展示 10 条评价
      },
      _count: { select: { reviews: true } }, // 评价总数（可能多于展示的 10 条）
    },
  });

  // 商品不存在或未发布时返回 404
  if (!product || !product.published) notFound();

  const images = parseImages(product.images);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ===== 左侧：商品图片区 ===== */}
        <div className="space-y-4">
          {images.length > 0 ? (
            // 渲染所有商品图片，每张带渐变背景容器
            images.map((image: string, i: number) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-6xl"
              >
                <img
                  src={image}
                  alt={`${product.name} - 图片 ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            // 无图片时显示占位图标
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-8xl">
              📦
            </div>
          )}
        </div>

        {/* ===== 右侧：商品信息区 ===== */}
        <div className="space-y-6">
          {/* 分类标签 + 商品名称 */}
          <div>
            <Badge className="mb-2">{product.category}</Badge>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          {/* 价格：红色现价 + 灰色划线原价 */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-500">
              &yen;{product.price.toFixed(2)}
            </span>
            {/* 仅在有原价时显示删除线原价 */}
            {product.comparePrice && (
              <span className="text-lg text-gray-400 line-through">
                &yen;{product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* 商品描述 */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* 库存状态提示 */}
          <div className="text-sm">
            {product.stock > 0 ? (
              <span className="text-green-600">有货（库存 {product.stock} 件）</span>
            ) : (
              <span className="text-red-500">暂时缺货</span>
            )}
          </div>

          {/* 加入购物车按钮（客户端组件，处理库存检查和状态更新） */}
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={product.price}
            image={images[0]}
            stock={product.stock}
          />

          {/* ===== 用户评价区 ===== */}
          {/* 仅在有评价数据时显示该区域 */}
          {product.reviews.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="mb-4 font-semibold">
                用户评价（{product._count.reviews}）
              </h3>
              <div className="space-y-3">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.user.name}</span>
                      {/* 星级渲染：实心星 ★ + 空心星 ☆ */}
                      <span className="text-yellow-500 text-sm">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
