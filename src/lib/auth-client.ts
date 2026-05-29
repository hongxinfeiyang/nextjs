// ============================================================================
// 客户端认证模块
// ============================================================================
// 使用 better-auth 的 React SDK 创建客户端认证实例，提供浏览器端可直接
// 调用的认证方法（登录、注册、登出、获取会话状态）。该模块在客户端组件
// 中使用，依赖 React 的 Context/Hooks 机制管理认证状态。
// ============================================================================

import { createAuthClient } from 'better-auth/react';

/**
 * 客户端认证实例
 *
 * 基于 better-auth 的 React SDK 创建，封装了与认证 API 的通信逻辑。
 * baseURL 和 basePath 需与服务端 auth 实例保持一致。
 */
export const authClient = createAuthClient({
  // 应用基础 URL，需与服务端配置一致
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004',
  // 认证 API 基础路径，需与服务端配置一致
  basePath: '/api/auth',
});

/**
 * 从 authClient 中解构导出的快捷认证方法
 *
 * signIn     - 登录方法，接收邮箱和密码
 * signOut    - 登出方法，销毁当前会话
 * signUp     - 注册方法，创建新用户账号
 * useSession - React Hook，获取当前登录用户的会话状态（响应式）
 */
export const { signIn, signOut, signUp, useSession } = authClient;
