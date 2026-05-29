// ============================================================================
// 订单相关的 Server Actions
// ============================================================================
// Next.js 服务端函数（'use server'），处理订单创建逻辑。
// 包括用户身份验证、库存校验、扣减库存、订单数据写入等关键操作，
// 所有数据库操作在 Prisma 事务中执行以保证数据一致性。
// ============================================================================

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { CartItem } from '@/stores/cart-store';

/**
 * 创建订单 Server Action
 *
 * 完整下单流程：
 * 1. 从服务端获取当前会话，验证用户是否已登录
 * 2. 检查购物车是否为空
 * 3. 在数据库事务中执行：
 *    a. 遍历所有商品，验证商品存在、已发布且库存充足
 *    b. 计算订单总金额，构建订单项数据
 *    c. 逐项扣减商品库存
 *    d. 创建订单及关联的订单项记录
 * 4. 完成后重新验证订单页面缓存，使新数据即时可见
 *
 * @param items - 购物车中的商品项列表（CartItem[]）
 * @returns 成功时 { success: true, orderId: string }，失败时 { error: string }
 */
export async function createOrder(items: CartItem[]) {
  // 获取当前登录用户的会话信息
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 未登录用户不能下单
  if (!session?.user) {
    return { error: '请先登录' };
  }

  // 购物车为空时不创建订单
  if (!items || items.length === 0) {
    return { error: '购物车是空的' };
  }

  try {
    // 使用 Prisma 事务确保所有操作原子性：任何一步失败则全部回滚
    const order = await db.$transaction(async (tx) => {
      // ---- 第一阶段：验证所有商品的可用性 ----
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        // 商品必须存在且处于发布状态
        if (!product || !product.published) {
          throw new Error(`商品 "${item.name}" 不存在或已下架`);
        }
        // 库存必须满足购买数量
        if (product.stock < item.quantity) {
          throw new Error(`商品 "${product.name}" 库存不足（剩余 ${product.stock} 件）`);
        }
      }

      // ---- 第二阶段：计算总金额并构建订单项 ----
      let total = 0;
      const orderItems: { productId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        // 再次查询商品以获取最新价格（事务内保证一致性）
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        const price = product!.price; // 第一阶段已验证 product 存在
        total += price * item.quantity; // 累加：单价 × 数量

        // 构建订单项的预创建数据
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price,
        });

        // 扣减商品库存：使用 Prisma 的 decrement 原子操作，避免并发问题
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // ---- 第三阶段：创建订单记录 ----
      return tx.order.create({
        data: {
          userId: session.user.id,       // 下单用户 ID
          total,                          // 订单总金额
          status: 'PAID',                // 模拟支付，直接标记为已支付
          paymentMethod: 'simulated',     // 模拟支付方式
          items: {
            // 使用 createMany 批量创建订单项，减少数据库往返
            createMany: { data: orderItems },
          },
        },
      });
    });

    // 重新验证订单页面缓存路径，使下次访问时拉取最新数据
    revalidatePath('/shop/orders');
    return { success: true, orderId: order.id };
  } catch (e) {
    // 区分已知错误（如库存不足）和未知异常
    if (e instanceof Error) {
      return { error: e.message };
    }
    return { error: '下单失败，请稍后重试' };
  }
}
