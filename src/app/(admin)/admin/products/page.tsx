/**
 * 商品管理列表页
 *
 * 【文件职责】
 * - 以表格形式展示所有商品，包括名称、分类、价格、库存、发布状态
 * - 提供新增商品入口按钮和编辑商品链接
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【状态说明】
 * - 空状态：当商品列表为空时，显示 EmptyState 组件引导用户新增商品
 */
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: '商品管理' };

/**
 * 商品管理列表页组件
 *
 * 服务端组件，获取所有商品数据并按创建时间降序排列。
 */
export default async function AdminProductsPage() {
  // 查询所有商品，按创建时间降序排列
  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      {/* 顶部标题栏 + 新增按钮 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link href="/admin/products/new">
          <Button>新增商品</Button>
        </Link>
      </div>

      {/* 空状态：无商品时引导用户创建 */}
      {products.length === 0 ? (
        <EmptyState
          title="暂无商品"
          description="点击上方按钮新增商品"
          actionLabel="新增商品"
          actionHref="/admin/products/new"
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="p-3 font-medium">商品</th>
                  <th className="p-3 font-medium">分类</th>
                  <th className="p-3 font-medium">价格</th>
                  <th className="p-3 font-medium">库存</th>
                  <th className="p-3 font-medium">状态</th>
                  <th className="p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">
                      <Badge>{p.category}</Badge>
                    </td>
                    <td className="p-3">&yen;{p.price.toFixed(2)}</td>
                    <td className="p-3">{p.stock}</td>
                    {/* 根据 published 字段显示发布或草稿状态 */}
                    <td className="p-3">
                      {p.published ? (
                        <Badge variant="success">已发布</Badge>
                      ) : (
                        <Badge variant="warning">草稿</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
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
