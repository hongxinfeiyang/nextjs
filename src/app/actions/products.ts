// ============================================================================
// 商品管理相关的 Server Actions
// ============================================================================
// Next.js 服务端函数（'use server'），处理商品和订单管理的后台操作。
// 所有操作均需通过 checkAdmin() 验证管理员权限，包含商品的增删改以及
// 订单状态更新功能。操作完成后通过 revalidatePath 刷新相关页面缓存。
// ============================================================================

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { ProductSchema } from '@/lib/validations';

/**
 * 管理员权限校验函数（内部辅助函数，不导出）
 *
 * 从请求头中获取当前会话，验证用户是否已登录且具有 ADMIN 角色。
 * 若未登录或非管理员，直接抛出异常，由调用方（Server Action）捕获。
 *
 * @throws {Error} 当用户未登录或非管理员时抛出 "无权限" 错误
 */
async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('无权限');
  }
}

/**
 * 创建新商品
 *
 * 从 FormData 解析字段，经 Zod 校验后入库。
 * 同时检查 slug 的唯一性，防止重复标识。
 *
 * @param formData - 商品表单数据
 * @returns 成功时 { success: true }，失败时 { error: fieldErrors }
 */
export async function createProduct(formData: FormData) {
  await checkAdmin();

  // 从 FormData 提取原始字段，checkbox 通过检查 'on' 值判断是否勾选
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    comparePrice: formData.get('comparePrice') || undefined, // 空字符串转为 undefined
    category: formData.get('category'),
    stock: formData.get('stock'),
    featured: formData.get('featured') === 'on',    // checkbox 勾选值为 'on'
    published: formData.get('published') === 'on',
  };

  // Zod 验证
  const result = ProductSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  // 检查 slug 唯一性（使用 @unique 约束前提前验证，给出友好提示）
  const existing = await db.product.findUnique({
    where: { slug: result.data.slug },
  });
  if (existing) {
    return { error: { slug: ['该标识已存在'] } };
  }

  // 创建商品记录
  await db.product.create({ data: result.data as any });
  // 重新验证管理员商品列表和商城商品列表的缓存
  revalidatePath('/admin/products');
  revalidatePath('/shop/products');
  return { success: true };
}

/**
 * 更新已有商品
 *
 * 通过 id 定位商品，更新所有字段。slug 唯一性检查排除自身。
 *
 * @param id       - 要更新的商品 ID
 * @param formData - 新的商品表单数据
 * @returns 成功时 { success: true }，失败时 { error: fieldErrors }
 */
export async function updateProduct(id: string, formData: FormData) {
  await checkAdmin();

  // 表单字段解析逻辑与 createProduct 一致
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    comparePrice: formData.get('comparePrice') || undefined,
    category: formData.get('category'),
    stock: formData.get('stock'),
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  };

  const result = ProductSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  // slug 唯一性检查：排除当前商品自身（NOT: { id }）
  const existing = await db.product.findFirst({
    where: { slug: result.data.slug, NOT: { id } },
  });
  if (existing) {
    return { error: { slug: ['该标识已存在'] } };
  }

  // 更新商品记录
  await db.product.update({
    where: { id },
    data: result.data as any,
  });
  // 刷新三个相关页面的缓存：后台列表、商城列表、商品详情
  revalidatePath('/admin/products');
  revalidatePath('/shop/products');
  revalidatePath(`/shop/products/${id}`);
  return { success: true };
}

/**
 * 删除商品
 *
 * 管理员可直接删除指定商品记录。
 *
 * @param id - 要删除的商品 ID
 * @returns { success: true }
 */
export async function deleteProduct(id: string) {
  await checkAdmin();

  await db.product.delete({ where: { id } });
  revalidatePath('/admin/products');
  revalidatePath('/shop/products');
  return { success: true };
}

/**
 * 更新订单状态
 *
 * 管理员后台操作，将订单状态修改为新值（如从 PENDING → PROCESSING）。
 *
 * @param orderId - 订单 ID
 * @param status  - 新的订单状态码（如 PROCESSING、SHIPPED、DELIVERED 等）
 */
export async function updateOrderStatus(orderId: string, status: string) {
  await checkAdmin();

  await db.order.update({
    where: { id: orderId },
    data: { status },
  });
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
}

/**
 * 通过 FormData 更新订单状态（适配 form action 直接调用场景）
 *
 * 从 FormData 中提取 orderId 和 status，然后委托给 updateOrderStatus 执行。
 * 适用于 HTML <form> action 属性直接绑定 Server Action 的模式。
 *
 * @param formData - 包含 orderId 和 status 字段的表单数据
 */
export async function updateOrderStatusAction(formData: FormData) {
  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as string;
  return updateOrderStatus(orderId, status);
}
