/**
 * 购物车页面 — /shop/cart
 *
 * 职责：
 * - 展示当前用户购物车中的商品列表
 * - 支持修改商品数量、删除商品
 * - 显示小计金额并提供去结算入口
 *
 * 状态管理：
 * - 使用 Zustand 的 useCartStore 管理购物车状态（客户端全局状态）
 * - 购物车数据存储在客户端内存中（非持久化），刷新页面后数据丢失
 * - 标记为 'use client' 因为使用了 React hooks 和浏览器事件处理
 *
 * 交互功能：
 * - 减号/加号按钮调整商品数量（最小为 1）
 * - 点击垃圾桶图标删除商品
 * - 空购物车时显示引导提示，防止用户困惑
 */

'use client';

import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, Minus, Plus } from 'lucide-react';

/**
 * CartPage — 购物车页面（客户端组件）
 *
 * 从 Zustand store 获取购物车状态，渲染商品列表、数量调整控件和结算入口。
 * 购物车为空时展示 EmptyState 引导用户去浏览商品。
 */
export default function CartPage() {
  // 从购物车 store 解构所需的方法和数据
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  // 购物车为空：显示引导界面
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">购物车</h1>
        <EmptyState
          title="购物车是空的"
          description="快去挑选心仪的商品吧"
          actionLabel="去逛逛"
          actionHref="/shop/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">购物车 ({items.length})</h1>

      {/* ===== 购物车商品列表 ===== */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-4"
          >
            {/* 商品缩略图（占位，实际项目应替换为真实图片） */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl">
              📦
            </div>

            {/* 商品名称 + 单价 */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/shop/products/${item.productId}`}
                className="font-medium text-gray-800 hover:text-blue-600 truncate block"
              >
                {item.name}
              </Link>
              <p className="text-red-500 font-medium">
                &yen;{item.price.toFixed(2)}
              </p>
            </div>

            {/* 数量调整控件：减号 / 当前数量 / 加号 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)} // 数量减 1（最小值为 1，store 中处理边界）
                className="rounded border p-1.5 hover:bg-gray-50"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)} // 数量加 1
                className="rounded border p-1.5 hover:bg-gray-50"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* 单项小计 = 单价 x 数量 */}
            <p className="w-28 text-right font-semibold">
              &yen;{(item.price * item.quantity).toFixed(2)}
            </p>

            {/* 删除商品按钮 */}
            <button
              onClick={() => removeItem(item.productId)} // 从购物车中移除该商品
              className="p-1.5 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* ===== 底部结算栏 ===== */}
      <div className="mt-8 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between text-xl font-bold">
          <span>合计</span>
          {/* subtotal() 计算购物车中所有商品的总价 */}
          <span className="text-red-500">&yen;{subtotal().toFixed(2)}</span>
        </div>
        {/* 点击跳转到结算页面 */}
        <Link href="/shop/checkout" className="mt-4 block">
          <Button size="lg" className="w-full">
            去结算
          </Button>
        </Link>
      </div>
    </div>
  );
}
