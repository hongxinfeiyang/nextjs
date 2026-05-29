/**
 * 订单详情页
 *
 * 【文件职责】
 * - 展示单个订单的完整信息：商品清单、金额、用户信息、状态等
 * - 提供订单状态流转操作按钮，管理员可推进订单到下一个合法状态
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【状态流转规则】
 * - PENDING（待支付）可转为 PAID（已支付）或 CANCELLED（已取消）
 * - PAID（已支付）可转为 PROCESSING（处理中）或 CANCELLED
 * - PROCESSING（处理中）可转为 SHIPPED（已发货）
 * - SHIPPED（已发货）可转为 DELIVERED（已送达）
 * - DELIVERED / CANCELLED 为终态，不可再流转
 *
 * 【错误处理】
 * - 订单不存在时调用 notFound() 返回 404
 */
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { ORDER_STATUSES } from '@/lib/constants';
import { updateOrderStatusAction } from '@/app/actions/products';

/** 页面参数类型 */
type Props = { params: Promise<{ id: string }> };

/**
 * 订单详情页组件
 *
 * 服务端组件，获取订单完整数据（含商品明细和用户信息），
 * 并根据当前状态计算可用的下一步操作。
 */
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;

  // 查询订单详情，包含订单项、关联商品和用户信息
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } }, // 订单项 + 关联商品信息
      user: { select: { name: true, email: true } }, // 仅取用户名和邮箱
    },
  });

  if (!order) notFound();

  // 定义订单状态流转规则：当前状态 -> 可转到的下一个状态列表
  const statusFlow: Record<string, string[]> = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],    // 终态，无下一步操作
    CANCELLED: [],    // 终态，无下一步操作
  };

  // 根据当前订单状态获取可操作的下一个状态列表
  const nextStatuses = statusFlow[order.status] || [];

  return (
    <div>
      {/* 返回订单列表的导航链接 */}
      <Link
        href="/admin/orders"
        className="mb-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← 返回订单列表
      </Link>

      <h1 className="mb-6 text-2xl font-bold">订单详情</h1>

      {/* 三栏布局：左侧商品清单（占 2/3） + 右侧订单信息和操作 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：商品清单 */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">商品清单</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between border-b pb-3 text-sm">
                  <span>
                    {item.product.name} × {item.quantity}
                  </span>
                  {/* 单项小计：单价 * 数量 */}
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
          </Card>
        </div>

        {/* 右侧：订单详情信息 + 状态操作 */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">订单信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">订单号</span>
                <span className="font-mono">#{order.id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">用户</span>
                <span>{order.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">邮箱</span>
                <span>{order.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">支付方式</span>
                <span>模拟支付</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">下单时间</span>
                <span>{order.createdAt.toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </Card>

          {/* 状态更新区域：仅当存在可流转的下一状态时显示 */}
          {nextStatuses.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 font-semibold">状态更新</h2>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  // 每个状态按钮使用独立的 form action 提交到服务端
                  <form key={status} action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button type="submit" variant="outline" size="sm">
                      {ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]}
                    </Button>
                  </form>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
