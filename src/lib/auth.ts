// ============================================================================
// 服务端认证配置模块
// ============================================================================
// 使用 better-auth 库初始化服务端认证实例，配置数据库适配器、登录方式、
// 会话过期时间等核心认证参数。导出单一的 auth 实例供服务端 API 路由和
// Server Actions 使用。
// ============================================================================

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from '@/lib/db';

/**
 * 服务端认证实例
 *
 * 配置了以下核心功能：
 * - 使用 Prisma 适配器连接 SQLite 数据库进行用户和会话持久化
 * - 启用邮箱+密码登录方式
 * - 会话有效期设为 30 天
 * - 认证相关的 API 路由挂载在 /api/auth 路径下
 */
export const auth = betterAuth({
  // 数据库适配器：使用 Prisma 连接 SQLite，由 better-auth 管理用户/会话表
  database: prismaAdapter(db, {
    provider: 'sqlite',
  }),
  // 启用邮箱密码登录
  emailAndPassword: {
    enabled: true,
  },
  // 会话配置：过期时间为 30 天（单位：秒）
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 天 = 30 * 24 * 60 * 60 秒
  },
  // 将数据库中 User 表的 role 字段暴露到 session.user 中，供前端鉴权使用
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
      },
    },
  },
  // 应用基础 URL，优先使用环境变量，开发环境默认 localhost:3004
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004',
  // 认证 API 的基础路径
  basePath: '/api/auth',
});
