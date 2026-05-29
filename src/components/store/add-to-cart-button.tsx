/**
 * AddToCartButton 加入购物车按钮组件
 *
 * 属于商城模块（store）的商品交互子组件。
 * 负责将指定商品添加到全局购物车 store（zustand）中，并实时显示该商品是否已在购物车。
 * 根据库存状态自动切换按钮 UI：有货显示"加入购物车"按钮，缺货显示禁用的"暂时缺货"状态。
 * 已加入购物车时按钮文字显示当前数量。
 *
 * @module components/store/add-to-cart-button
 */

'use client';

import { useCartStore } from '@/stores/cart-store';

/**
 * AddToCartButton 组件的 Props 类型
 */
type AddToCartButtonProps = {
  /** 商品唯一标识 ID，用于在购物车中标识该商品 */
  productId: string;
  /** 商品名称，添加至购物车时保存 */
  name: string;
  /** 商品单价，添加至购物车时保存 */
  price: number;
  /** 商品图片 URL，选填；添加至购物车时保存 */
  image?: string;
  /** 商品库存数量，为 0 时按钮变为禁用状态 */
  stock: number;
};

/**
 * AddToCartButton 加入购物车按钮组件
 *
 * 使用 zustand 的 cartStore 管理购物车状态。
 * 组件会根据 stock 和购物车已有状态，展示三种不同的 UI：
 * 1. 库存为 0：灰色禁用按钮，显示"暂时缺货"
 * 2. 商品未在购物车：蓝色按钮，显示"加入购物车"
 * 3. 商品已在购物车：蓝色按钮，显示"已加入购物车 (N)"
 *
 * @param props - 加入购物车按钮属性
 */
export function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
}: AddToCartButtonProps) {
  const { addItem, items } = useCartStore();
  /** 检查当前商品是否已在购物车中 */
  const inCart = items.find((i) => i.productId === productId);

  // 库存为 0 时渲染禁用的缺货按钮
  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full rounded-lg bg-gray-300 py-3 text-white cursor-not-allowed"
      >
        暂时缺货
      </button>
    );
  }

  return (
    <button
      onClick={() =>
        // 将商品信息添加到 cartStore
        addItem({
          productId,
          name,
          price,
          image: image || '', // 无图片时使用空字符串
        })
      }
      className="w-full rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700 transition-colors"
    >
      {/* 已加入购物车时显示数量，否则显示加入购物车 */}
      {inCart ? `已加入购物车 (${inCart.quantity})` : '加入购物车'}
    </button>
  );
}
