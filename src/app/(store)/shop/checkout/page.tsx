/**
 * 结算/下单确认页 — /shop/checkout
 *
 * 职责：
 * - 展示订单确认信息：商品清单、支付方式、应付金额
 * - 提供"确认下单"按钮，调用 Server Action 创建订单
 * - 下单成功后清空购物车并跳转到订单详情页
 *
 * 数据流：
 * - 从 Zustand cart store 读取当前购物车商品
 * - 调用 Server Action（createOrder）在服务端创建订单记录
 * - Server Action 返回值驱动客户端行为（错误展示 / 成功跳转）
 *
 * 安全考量：
 * - 下单操作在服务端执行（Server Action），客户端仅传递商品 ID 和数量
 * - 服务端重新计算价格和校验库存，防止客户端篡改
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { createOrder } from '@/app/actions/orders';
import { Button } from '@/components/ui/button';

/**
 * CheckoutPage — 订单确认页面（客户端组件）
 *
 * 展示订单摘要并处理下单流程：
 * 1. 展示购物车中的商品清单和总价
 * 2. 用户点击"确认下单"触发 handlePlaceOrder
 * 3. 调用 Server Action 创建订单
 * 4. 成功后清空购物车 + 跳转订单详情；失败则显示错误
 */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false); // 下单加载状态，防止重复提交
  const [error, setError] = useState(''); // 下单错误信息

  /**
   * 处理下单操作
   *
   * 1. 设置 loading 状态，禁用按钮避免重复提交
   * 2. 调用服务端 createOrder Action，传入当前购物车商品
   * 3. 成功：清空购物车 -> 跳转到订单详情页
   * 4. 失败：展示错误信息，保留购物车内容供用户重试
   */
  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(''); // 清除之前的错误

    // 调用 Server Action，在服务端校验并创建订单
    const result = await createOrder(items);

    if (result.error) {
      // 服务端返回错误（如库存不足、未登录等）
      setError(result.error);
      setLoading(false);
      return; // 保留购物车内容，让用户修正后再试
    }

    // 下单成功：清空购物车并跳转到订单详情
    clearCart();
    router.push(`/shop/orders/${result.orderId}`);
  };

  // 购物车为空时提示（防止直接访问 /shop/checkout）
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-gray-500">购物车是空的，请先添加商品</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">确认订单</h1>

      {/* 错误信息提示条（例如库存不足、下单失败等） */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        {/* ===== 订单商品清单 ===== */}
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="mb-4 font-semibold">订单商品</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">
                  &yen;{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 支付方式（当前为模拟支付） ===== */}
        <div className="rounded-xl border border-gray-200 p-6">
          <h2 className="mb-4 font-semibold">支付方式</h2>
          <p className="text-sm text-gray-500">模拟支付（学习项目）</p>
        </div>

        {/* ===== 应付金额 ===== */}
        <div className="rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>应付金额</span>
            <span className="text-red-500">&yen;{subtotal().toFixed(2)}</span>
          </div>
        </div>

        {/* 确认下单按钮：loading 时禁用并显示"提交中..." */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? '提交中...' : '确认下单'}
        </Button>
      </div>
    </div>
  );
}
