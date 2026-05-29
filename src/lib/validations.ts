// ============================================================================
// 表单数据验证 Schema 模块
// ============================================================================
// 使用 Zod 库定义前后端共享的数据验证规则，确保用户输入数据的合法性。
// 包含注册、登录、商品管理三大场景的验证 Schema，每个字段均定义了
// 中文错误提示信息。
// ============================================================================

import { z } from 'zod';

/**
 * 用户注册表单验证 Schema
 *
 * 验证规则：
 * - name：非空且至少 2 个字符
 * - email：非空且符合邮箱格式
 * - password：非空且至少 8 个字符
 */
export const RegisterSchema = z.object({
  name: z.string().min(1, '请输入姓名').min(2, '姓名至少2个字符'),
  email: z.string().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码').min(8, '密码至少8个字符'),
});

/**
 * 用户登录表单验证 Schema
 *
 * 验证规则：
 * - email：非空且符合邮箱格式
 * - password：非空（密码验证由服务端完成）
 */
export const LoginSchema = z.object({
  email: z.string().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * 商品管理表单验证 Schema
 *
 * 用于创建和编辑商品时的数据校验。
 * 关键规则：
 * - price：使用 coerce.number 将字符串输入强制转为数字，必须大于 0
 * - comparePrice：可选，可空，存在时必须大于 0
 * - stock：整数，不能为负数
 * - featured/published：布尔型复选框，可能为 undefined（未勾选）
 */
export const ProductSchema = z.object({
  name: z.string().min(1, '请输入商品名称'),
  slug: z.string().min(1, '请输入商品标识'),
  description: z.string().min(1, '请输入商品描述'),
  price: z.coerce.number().positive('价格必须大于0'), // coerce 将 formData 字符串转为数字
  comparePrice: z.coerce.number().positive().optional().nullable(), // 可选的对比价
  category: z.string().min(1, '请选择分类'),
  stock: z.coerce.number().int().min(0, '库存不能为负数'), // 整数库存，非负
  featured: z.coerce.boolean().optional(),  // 是否推荐，复选框未勾选时为 undefined
  published: z.coerce.boolean().optional(), // 是否发布，复选框未勾选时为 undefined
});
