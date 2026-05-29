// ============================================================================
// 认证 API 路由处理器
// ============================================================================
// Next.js App Router 的 catch-all 路由，将 /api/auth/* 的所有请求
// （GET、POST）转发给 better-auth 的 Next.js 适配器处理。
//
// better-auth 通过此路由暴露认证相关的端点，包括：
// - POST /api/auth/sign-in    → 邮箱密码登录
// - POST /api/auth/sign-up    → 用户注册
// - GET  /api/auth/session    → 获取当前会话信息
// - POST /api/auth/sign-out   → 登出
// 以及其他 better-auth 自动生成的认证端点。
// ============================================================================

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * 将 better-auth 实例打包为 Next.js 兼容的 GET/POST 路由处理器
 *
 * toNextJsHandler 会自动解析路由路径，将请求分发到 better-auth 内部
 * 对应的处理器（注册、登录、会话管理等），并返回标准 Response。
 */
export const { GET, POST } = toNextJsHandler(auth);
