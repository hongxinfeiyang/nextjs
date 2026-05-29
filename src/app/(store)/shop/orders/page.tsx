/**
 * 订单列表页 — /shop/orders
 *
 * 职责：
 * - 展示当前登录用户的所有历史订单
 * - 每个订单卡片显示：订单号（截取后8位）、状态标签、前3件商品摘要、总金额、下单日期
 * - 未登录用户重定向到登录页（展示引导提示）
 *
 * 鉴权策略：
 * - 服务端通过 Better Auth 的 getSession 获取当前会话
 * - 未登录时渲染引导界面（而非实际跳转，给予用户友好的体验）
 * - 已登录用户仅查询属于自己的订单（userId 过滤）
 *
 * 数据获取：
 * - 通过 Prisma 关联查询一次性获取订单、订单项和商品信息
 * - 按创建时间降序排列（最新订单在前）
 */

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ORDER_STATUSES } from '@/lib/constants';

/** 页面元数据 */
export const metadata = { title: '我的订单' };

/**
 * 订单状态到 Badge 组件 variant 的映射表
 *
 * PENDING（待支付）和 SHIPPED（已发货）使用 warning 黄色
 * PAID（已支付）和 DELIVERED（已送达）使用 success 绿色
 * PROCESSING（处理中）使用 default 灰色
 * CANCELLED（已取消）使用 danger 红色
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
 * OrdersPage — 用户订单列表页（服务端组件）
 *
 * 鉴权后从数据库查询当前用户的所有订单，
 * 空订单显示引导提示，有订单时渲染订单卡片列表。
 */
export default async function OrdersPage() {
  // 获取当前用户会话（服务端鉴权）
  const session = await auth.api.getSession({
    headers: await headers(), // Next.js 需要显式传入 headers
  });

  // 未登录：显示引导提示而非报错
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          title="请先登录"
          description="登录后查看您的订单"
          actionLabel="去登录"
          actionHref="/login?redirect=/shop/orders" // 登录后回跳订单页
        />
      </div>
    );
  }

  // 查询当前用户的订单，包含订单项和关联商品信息
  const orders = await db.order.findMany({
    where: { userId: session.user.id }, // 仅查询当前用户的订单
    include: { items: { include: { product: true } } }, // 级联获取订单项 -> 商品
    orderBy: { createdAt: 'desc' }, // 最新订单显示在最前
  });

  // 空订单：引导用户去选购商品
  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">我的订单</h1>
        <EmptyState
          title="暂无订单"
          description="快去选购商品吧"
          actionLabel="去逛逛"
          actionHref="/shop/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">我的订单</h1>

      {/* ===== 订单卡片列表 ===== */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/shop/orders/${order.id}`} // 点击跳转到订单详情
            className="block rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* 订单头部：订单号（截取后 8 位大写） + 状态标签 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">
                订单号：{order.id.slice(-8).toUpperCase()}
              </span>
              {/* 根据状态映射对应颜色的 Badge */}
              <Badge variant={statusVariant[order.status] || 'default'}>
                {ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || order.status}
              </Badge>
            </div>

            {/* 订单商品摘要：最多显示 3 件商品 */}
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span>&yen;{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {/* 超过 3 件时提示剩余数量 */}
              {order.items.length > 3 && (
                <p className="text-xs text-gray-400">
                  ...还有 {order.items.length - 3} 件商品
                </p>
              )}
            </div>

            {/* 订单底部：下单日期 + 订单总金额 */}
            <div className="mt-3 flex justify-between border-t pt-3">
              <span className="text-sm text-gray-500">
                {order.createdAt.toLocaleDateString('zh-CN')} {/* 格式化中文日期 */}
              </span>
              <span className="font-bold text-red-500">
                &yen;{order.total.toFixed(2)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
