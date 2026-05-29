// ============================================================================
// 购物车状态管理 Store（Zustand）
// ============================================================================
// 使用 Zustand 的 persist 中间件实现购物车功能，支持本地持久化存储
// （localStorage）。提供商品添加、移除、数量修改、清空购物车等操作，
// 以及小计金额和商品总数的计算。
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 购物车商品项类型定义
 *
 * productId - 商品 ID（关联 Product 模型）
 * name      - 商品名称（快照，便于显示）
 * price     - 商品单价（快照，结算时使用）
 * image     - 商品图片 URL（快照）
 * quantity  - 购买数量
 */
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

/**
 * 购物车 Store 类型定义
 *
 * 包含购物车状态（items）和操作方法（addItem、removeItem 等），
 * 以及两个派生计算属性（subtotal、itemCount）。
 */
type CartStore = {
  items: CartItem[]; // 当前购物车中的所有商品项

  /** 添加商品到购物车，若已存在则数量 +1 */
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  /** 从购物车中移除指定商品 */
  removeItem: (productId: string) => void;
  /** 修改指定商品的购买数量，若数量 <= 0 则自动移除 */
  updateQuantity: (productId: string, quantity: number) => void;
  /** 清空购物车中所有商品 */
  clearCart: () => void;
  /** 计算购物车小计金额（单价 × 数量的累加） */
  subtotal: () => number;
  /** 计算购物车中商品总件数 */
  itemCount: () => number;
};

/**
 * 购物车全局状态 Hook
 *
 * 使用 Zustand 创建，并通过 persist 中间件将购物车数据自动同步到
 * localStorage 中（key 为 "shop-cart"），实现页面刷新后购物车数据不丢失。
 *
 * @example
 * const { items, addItem, removeItem, subtotal } = useCartStore();
 */
export const useCartStore = create<CartStore>()(
  persist(
    // set: 用于更新状态; get: 用于读取当前状态（在计算属性中使用）
    (set, get) => ({
      items: [],

      /**
       * 添加商品到购物车
       * 如果商品已存在，则将其数量 +1；否则将新商品加入列表（数量初始为 1）。
       */
      addItem: (item) =>
        set((state) => {
          // 查找购物车中是否已有该商品
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            // 存在：返回更新后的数组，该商品数量 +1
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          // 不存在：追加新商品，初始数量为 1
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      // 移除商品：过滤掉 productId 匹配的项
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        })),

      /**
       * 更新商品数量
       * 如果 quantity > 0，更新对应商品的数量；
       * 如果 quantity <= 0，自动从购物车中移除该商品。
       */
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map(i =>
                i.productId === productId ? { ...i, quantity } : i,
              )
            : state.items.filter(i => i.productId !== productId),
        })),

      // 清空购物车：直接重置 items 为空数组
      clearCart: () => set({ items: [] }),

      /**
       * 计算购物车小计金额
       * 使用 get() 获取当前状态（非响应式快照），累加每个商品的 单价 × 数量。
       */
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      /**
       * 计算购物车总商品件数
       * 对所有商品的数量求和（不是去重项数）。
       */
      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      // persist 中间件配置：localStorage 存储键名为 'shop-cart'
      name: 'shop-cart',
    },
  ),
);
