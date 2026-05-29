/**
 * 订单管理列表页
 *
 * 【文件职责】
 * - 以表格形式展示所有订单，包括订单号、用户、金额、状态、时间
 * - 每行订单号可点击跳转至订单详情页
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【数据获取】
 * - 查询订单时使用 include 关联用户信息（姓名、邮箱）以减少 N+1 查询
 * - 按创建时间降序排列，最新订单在前
 *
 * 【状态说明】
 * - 空状态：当没有订单时显示 EmptyState 提示
 */
import Link from 'next/link';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/status-badge';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: '订单管理' };

/**
 * 订单管理列表页组件
 *
 * 服务端组件，获取全部订单及关联用户数据进行展示。
 */
export default async function AdminOrdersPage() {
  // 查询所有订单并关联用户信息，按创建时间降序排列
  const orders = await db.order.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">订单管理</h1>

      {/* 空状态：无订单时显示提示 */}
      {orders.length === 0 ? (
        <EmptyState title="暂无订单" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-3 font-medium">订单号</th>
                  <th className="p-3 font-medium">用户</th>
                  <th className="p-3 font-medium">金额</th>
                  <th className="p-3 font-medium">状态</th>
                  <th className="p-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="p-3">
                      {/* 订单号可点击跳转到订单详情页 */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="p-3">{order.user.name}</td>
                    <td className="p-3">&yen;{order.total.toFixed(2)}</td>
                    <td className="p-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-3 text-gray-500">
                      {order.createdAt.toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
