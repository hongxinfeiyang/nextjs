/**
 * 新增商品页面
 *
 * 【文件职责】
 * - 提供创建新商品的表单，包含名称、slug、描述、价格、原价、分类、库存等字段
 * - 支持设置推荐商品和立即发布选项
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【数据提交】
 * - 调用服务端 action createProduct 处理表单数据
 * - 表单验证在服务端执行，错误通过 errors 状态返回展示
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';

/**
 * 新增商品页面组件
 *
 * 客户端组件，通过服务端 action 创建商品，
 * 表单验证在服务端完成，错误信息回传给客户端展示。
 */
export default function NewProductPage() {
  const router = useRouter();
  // 字段级别的错误信息，格式为 { 字段名: [错误消息数组] }
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  /** 处理创建商品表单提交 */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    // 调用服务端 action 创建商品，验证逻辑在服务端执行
    const result = await createProduct(formData);

    if (result.error) {
      // 展示服务端返回的字段级别验证错误
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
      return;
    }

    // 创建成功后跳转到商品管理列表页
    router.push('/admin/products');
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">新增商品</h1>

      <Card className="max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 第一行：名称 + slug（URL 标识） */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">名称</label>
              <Input name="name" required />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">标识 (slug)</label>
              <Input name="slug" required placeholder="product-slug" />
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description[0]}</p>}
          </div>

          {/* 第二行：价格 + 原价 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">价格 (元)</label>
              <Input name="price" type="number" step="0.01" min="0" required />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">原价 (元，可选)</label>
              <Input name="comparePrice" type="number" step="0.01" min="0" />
            </div>
          </div>

          {/* 第三行：分类 + 库存 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <select
                name="category"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">选择分类</option>
                {/* 从 CATEGORIES 常量中动态生成分类选项 */}
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">库存</label>
              <Input name="stock" type="number" min="0" required defaultValue="0" />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock[0]}</p>}
            </div>
          </div>

          {/* 复选框：推荐商品 + 立即发布 */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" className="rounded" />
              推荐商品
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="published" defaultChecked className="rounded" />
              立即发布
            </label>
          </div>

          {/* 操作按钮组 */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建商品'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
