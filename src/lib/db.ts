// ============================================================================
// 数据库客户端单例模块
// ============================================================================
// 使用 Prisma ORM 创建并导出全局唯一的 PrismaClient 实例。
// 通过 globalThis 缓存实例，避免在开发环境（热重载）下重复创建数据库连接，
// 在生产环境则每次启动创建新实例。
// ============================================================================

import { PrismaClient } from '@prisma/client';

// 将 globalThis 断言为带有 prisma 属性的类型，用于缓存 PrismaClient 实例
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 优先使用全局缓存的实例，不存在则创建新的 PrismaClient
export const db = globalForPrisma.prisma || new PrismaClient();

// 开发环境下将实例存入 globalThis，以便 Next.js 热重载时复用，避免连接泄漏
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
