// ============================================================================
// 认证相关的 Server Actions
// ============================================================================
// Next.js 服务端函数（'use server'），在服务器端执行用户注册逻辑。
// 包含表单数据解析、Zod 校验、邮箱唯一性检查、密码哈希加密和用户创建。
// 这些函数可直接在客户端组件中通过 form action 属性调用。
// ============================================================================

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { RegisterSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

/**
 * 用户注册 Server Action
 *
 * 注册流程：
 * 1. 从 FormData 中提取原始字段值
 * 2. 使用 Zod Schema 验证输入合法性
 * 3. 检查邮箱是否已被注册
 * 4. 使用 bcrypt 对密码进行哈希加密（盐轮 12 次）
 * 5. 将用户数据写入数据库
 *
 * @param formData - 前端表单提交的原始 FormData 对象
 * @returns 成功时 { success: true }，失败时 { error: { field: [messages] } }
 */
export async function registerUser(formData: FormData) {
  // 从 FormData 中提取注册所需的三个字段
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  // 使用 Zod Schema 进行安全解析（safeParse 不抛出异常，返回结果对象）
  const result = RegisterSchema.safeParse(raw);
  if (!result.success) {
    // 校验失败：将 Zod 错误扁平化为字段级错误信息返回
    return { error: result.error.flatten().fieldErrors };
  }

  // 解构出经过 Zod 验证和类型转换后的安全数据
  const { name, email, password } = result.data;

  // 检查邮箱是否已被注册（利用 email 字段的 @unique 约束）
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: { email: ['该邮箱已注册'] } };
  }

  // 使用 bcrypt 对密码进行哈希处理，盐轮数 12 提供足够的安全性
  const hashedPassword = await bcrypt.hash(password, 12);

  // 创建用户记录，存储哈希后的密码（永远不存明文）
  await db.user.create({
    data: { name, email, password: hashedPassword },
  });

  return { success: true };
}
