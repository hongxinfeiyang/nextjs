/**
 * 编辑商品表单组件
 *
 * 【文件职责】
 * - 提供编辑已有商品的表单界面，预填当前商品数据
 * - 支持更新商品信息和删除商品两项操作
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【数据操作】
 * - 更新：调用服务端 action updateProduct 提交修改
 * - 删除：调用服务端 action deleteProduct 并弹出确认对话框
 * - 表单验证在服务端执行，错误信息回传展示
 *
 * 【注意】
 * - 删除操作不可撤销，前端 confirm 作为第一次确认
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, deleteProduct } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';

/** 商品数据类型定义，来自数据库查询结果 */
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  category: string;
  stock: number;
  featured: boolean;
  published: boolean;
};

/**
 * 编辑商品表单组件
 *
 * 客户端组件，使用 defaultValue 预填表单字段。
 * 表单提交通过服务端 action 处理，支持更新和删除操作。
 *
 * @param props.product - 待编辑的完整商品数据对象
 */
export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  // 字段级别验证错误
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  // 删除操作的独立 loading 状态，避免与保存状态混淆
  const [deleting, setDeleting] = useState(false);

  /** 处理商品更新表单提交 */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    // 调用服务端 action 更新商品数据
    const result = await updateProduct(product.id, formData);

    if (result.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
      return;
    }

    // 更新成功后返回商品列表页
    router.push('/admin/products');
  };

  /** 处理商品删除操作，含前端确认弹窗 */
  const handleDelete = async () => {
    // 双重确认机制：前端 confirm + 服务端校验
    if (!confirm('确定要删除该商品吗？此操作不可撤销。')) return;
    setDeleting(true);

    await deleteProduct(product.id);
    router.push('/admin/products');
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">编辑商品</h1>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 第一行：名称 + slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">名称</label>
              {/* 使用 defaultValue 预填当前商品名称 */}
              <Input name="name" required defaultValue={product.name} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">标识 (slug)</label>
              <Input name="slug" required defaultValue={product.slug} />
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug[0]}</p>}
            </div>
          </div>

          {/* 描述字段 */}
          <div>
            <label className="mb-1 block text-sm font-medium">描述</label>
            <textarea
              name="description"
              required
              rows={3}
              defaultValue={product.description}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description[0]}</p>}
          </div>

          {/* 第二行：价格 + 原价 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">价格 (元)</label>
              <Input name="price" type="number" step="0.01" min="0" required defaultValue={product.price} />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">原价 (元，可选)</label>
              {/* comparePrice 可能为 null，回退为空字符串 */}
              <Input name="comparePrice" type="number" step="0.01" min="0" defaultValue={product.comparePrice || ''} />
            </div>
          </div>

          {/* 第三行：分类 + 库存 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <select
                name="category"
                required
                defaultValue={product.category}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">库存</label>
              <Input name="stock" type="number" min="0" required defaultValue={product.stock} />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock[0]}</p>}
            </div>
          </div>

          {/* 复选框：根据当前商品数据回显推荐和发布状态 */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product.featured} className="rounded" />
              推荐商品
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked={product.published} className="rounded" />
              已发布
            </label>
          </div>

          {/* 操作按钮组：保存、取消、flex-1 占位分隔、删除 */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            {/* flex-1 将删除按钮推到最右侧 */}
            <div className="flex-1" />
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '删除中...' : '删除'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
