/**
 * 订单详情页 — /shop/orders/[id]
 *
 * 职责：
 * - 展示单个订单的完整信息：订单号、下单时间、状态标签、商品清单、总金额
 * - 验证订单归属于当前登录用户，防止越权访问他人订单
 * - 提供返回订单列表的导航链接
 *
 * 鉴权与授权：
 * - 双重检查：先验证用户是否登录，再验证订单是否属于当前用户
 * - 任一条件不满足时调用 notFound()（安全做法：不泄露订单是否存在的信息）
 *
 * 动态路由参数：
 * - id: 订单的唯一标识符
 */

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUSES } from '@/lib/constants';
import type { Metadata } from 'next';

/** 页面 Props */
type Props = { params: Promise<{ id: string }> };

/**
 * 订单状态到 Badge 组件 variant 的映射表
 * 与订单列表页保持一致的颜色方案
 */
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  PAID: 'success',
  PROCESSING: 'default',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

/**
 * 动态生成页面元数据
 * @returns 订单详情页的标题
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `订单详情` };
}

/**
 * OrderDetailPage — 订单详情页（服务端组件）
 *
 * 获取订单全部信息并展示，包括：
 * - 订单基本信息（编号、时间、状态）
 * - 商品清单（名称、单价、数量、金额）
 * - 订单总金额
 *
 * 安全验证：
 * - 检查用户登录状态
 * - 检查订单归属（order.userId === session.user.id）
 * - 验证失败调用 notFound() 返回 404
 *
 * @param params - 动态路由参数，包含订单 ID
 */
export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  // 获取当前用户会话，用于鉴权
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 未登录用户不能查看订单详情
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  // 查询订单详细信息，包含订单项、商品和用户信息
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } }, // 订单项 -> 商品详情
      user: { select: { name: true, email: true } }, // 仅获取必要的用户字段
    },
  });

  // 安全校验：订单不存在 或 不属于当前用户 -> 返回 404
  // 使用 notFound 而非显式报错，避免泄露订单存在性信息
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* 返回订单列表的导航链接 */}
      <Link
        href="/shop/orders"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← 返回订单列表
      </Link>

      <h1 className="mb-6 text-2xl font-bold">订单详情</h1>

      <div className="space-y-6">
        {/* ===== 订单基本信息卡片 ===== */}
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              {/* 订单号：截取后 8 位并转大写，提高可读性 */}
              <p className="text-sm text-gray-500">
                订单号：{order.id.slice(-8).toUpperCase()}
              </p>
              {/* 下单时间：使用中文格式化 */}
              <p className="text-sm text-gray-500">
                下单时间：{order.createdAt.toLocaleString('zh-CN')}
              </p>
            </div>
            {/* 订单状态标签，颜色根据状态映射 */}
            <Badge variant={statusVariant[order.status] || 'default'}>
              {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || order.status}
            </Badge>
          </div>
        </div>

        {/* ===== 商品清单卡片 ===== */}
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="mb-4 font-semibold">商品清单</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-3"
              >
                <div className="flex items-center gap-3">
                  {/* 商品缩略图（占位） */}
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xl">
                    📦
                  </div>
                  <div>
                    {/* 商品名称链接，可跳转回商品详情页 */}
                    <Link
                      href={`/shop/products/${item.productId}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      &yen;{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                </div>
                {/* 单项金额 = 购买时的单价 × 数量 */}
                <span className="font-medium">
                  &yen;{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* 订单总金额 */}
          <div className="mt-4 flex justify-between text-lg font-bold">
            <span>合计</span>
            <span className="text-red-500">&yen;{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
