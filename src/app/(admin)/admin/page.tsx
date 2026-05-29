/**
 * 管理后台仪表盘页面
 *
 * 【文件职责】
 * - 展示核心业务指标概览：总营收、总订单数、用户数、商品数
 * - 展示最近 5 条订单记录
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权，本页面不自建鉴权逻辑
 *
 * 【数据获取】
 * - 使用 Promise.all 并行查询四项统计数据，减少数据库往返次数
 * - 营收统计仅计算有效订单（已支付、处理中、已发货、已送达状态）
 */
import { db } from '@/lib/db';
import { StatsCard } from '@/components/admin/stats-card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Card } from '@/components/ui/card';

export const metadata = { title: '管理后台' };

/**
 * 管理后台仪表盘组件
 *
 * 服务端组件，直接查询数据库获取统计数据并渲染。
 */
export default async function AdminDashboard() {
  // 并行查询四项核心统计数据，提升性能
  const [totalRevenue, totalOrders, totalUsers, totalProducts] =
    await Promise.all([
      // 聚合查询有效订单的总营收（排除待支付和已取消订单）
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
      db.order.count(),
      db.user.count(),
      db.product.count(),
    ]);

  // 获取最近 5 条订单，包含关联的用户信息
  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>

      {/* 四张统计卡片：总营收、总订单、用户数、商品数 */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="总营收"
          value={`¥${(totalRevenue._sum.total || 0).toLocaleString()}`}
        />
        <StatsCard title="总订单" value={String(totalOrders)} />
        <StatsCard title="用户数" value={String(totalUsers)} />
        <StatsCard title="商品数" value={String(totalProducts)} />
      </div>

      {/* 最近订单表格 */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">最近订单</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-gray-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">订单号</th>
                <th className="pb-3 pr-4 font-medium">用户</th>
                <th className="pb-3 pr-4 font-medium">金额</th>
                <th className="pb-3 pr-4 font-medium">状态</th>
                <th className="pb-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  {/* 取订单 ID 后 8 位大写作为展示编号 */}
                  <td className="py-3 pr-4 font-mono text-xs">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="py-3 pr-4">{order.user.name}</td>
                  <td className="py-3 pr-4">&yen;{order.total.toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-gray-500">
                    {order.createdAt.toLocaleDateString('zh-CN')}
                  </td>
                </tr>
              ))}
              {/* 最近订单为空时的兜底展示 */}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    暂无订单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
