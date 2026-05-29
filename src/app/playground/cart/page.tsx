'use client';

import { useDemoCartStore } from '@/stores/cart-demo-store';

const sampleProducts = [
  { productId: '1', name: '机械键盘', price: 299 },
  { productId: '2', name: '无线鼠标', price: 89 },
  { productId: '3', name: '显示器支架', price: 159 },
  { productId: '4', name: 'Type-C 数据线', price: 29.9 },
];

export default function CartDemoPage() {
  const { items, addItem, removeItem, updateQuantity, subtotal, itemCount } = useDemoCartStore();

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold">Zustand 购物车</h1>
        <p className="mb-8 text-gray-500">
          演示 Zustand 全局状态管理 + persist 本地持久化。刷新页面购物车数据不丢失。
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 商品列表 */}
          <div className="rounded-xl border p-6">
            <h2 className="mb-3 font-semibold">商品</h2>
            <div className="space-y-2">
              {sampleProducts.map(p => (
                <div key={p.productId} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-sm text-red-500">¥{p.price}</p>
                  </div>
                  <button
                    onClick={() => addItem(p)}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs text-white font-medium hover:bg-brand-dark"
                  >
                    加入购物车
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 购物车 */}
          <div className="rounded-xl border p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">购物车 ({itemCount()})</h2>
              {items.length > 0 && (
                <span className="text-lg font-bold text-red-500">¥{subtotal().toFixed(2)}</span>
              )}
            </div>

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">购物车是空的</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-sm dark:bg-gray-800">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="rounded border px-2 py-0.5 text-xs"
                      >-</button>
                      <span className="w-6 text-center text-xs">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="rounded border px-2 py-0.5 text-xs"
                      >+</button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-2 text-xs text-red-500"
                      >删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          数据通过 Zustand persist 中间件自动存入 localStorage。打开 DevTools → Application → Local Storage 查看。
        </p>
      </div>
    </div>
  );
}
