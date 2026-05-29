/**
 * StoreHeader 商城顶部导航栏组件
 *
 * 属于商城模块（store）的布局组件，固定在页面顶部（sticky）。
 * 包含商城 Logo、商品列表/购物车/订单的导航链接，以及用户登录状态展示。
 * 购物车图标上会显示当前购物车中的商品数量角标（最多显示 99+）。
 * 登录后显示用户名和退出按钮，未登录显示登录入口。
 *
 * @module components/store/store-header
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Package, User, LogOut } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useSession, signOut } from '@/lib/auth-client';

/**
 * StoreHeader 商城顶部导航栏组件
 *
 * 使用客户端渲染（'use client'），因为依赖：
 * - 购物车状态（zustand store）
 * - 用户会话信息（auth-client）
 * - 浏览器路由事件（useRouter）
 *
 * mounted 状态用于防止服务端渲染时的 hydration 不匹配问题。
 */
export function StoreHeader() {
  const router = useRouter();
  /** 标记组件是否已在客户端挂载，避免 SSR 与客户端渲染不一致 */
  const [mounted, setMounted] = useState(false);
  /** 从 cart store 获取购物车商品总数量 */
  const itemCount = useCartStore((s) => s.itemCount());
  /** 获取当前用户会话信息 */
  const { data: session } = useSession();

  // 组件挂载后将 mounted 设为 true，确保客户端专用逻辑正常执行
  useEffect(() => setMounted(true), []);

  /**
   * 处理用户退出登录
   * 调用 signOut 清除认证状态，然后刷新当前路由
   */
  const handleLogout = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo 区域，点击返回商城首页 */}
        <Link href="/shop" className="text-xl font-bold text-blue-600">
          ShopNext
        </Link>

        <nav className="flex items-center gap-6">
          {/* 商品列表导航 */}
          <Link
            href="/shop/products"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
          >
            <Package size={16} />
            <span>商品</span>
          </Link>

          {/* 购物车导航，带商品数量角标 */}
          <Link
            href="/shop/cart"
            className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
          >
            <ShoppingCart size={16} />
            <span>购物车</span>
            {/* 仅在客户端挂载后且购物车有商品时显示数量角标 */}
            {mounted && itemCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {/* 超过 99 件显示 "99+" */}
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {/* 订单列表导航 */}
          <Link
            href="/shop/orders"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
          >
            我的订单
          </Link>

          {/* 用户状态区域：根据挂载状态和登录状态展示不同 UI */}
          {!mounted ? (
            // 未挂载时显示占位状态，避免 SSR 闪烁
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <User size={16} />
              <span>...</span>
            </span>
          ) : session?.user ? (
            // 已登录：管理员显示管理入口，所有用户显示用户名和退出按钮
            <div className="flex items-center gap-3">
              {(session.user as any).role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  管理
                </Link>
              )}
              <span className="text-sm text-gray-600">
                {session.user.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500"
              >
                <LogOut size={14} />
                退出
              </button>
            </div>
          ) : (
            // 未登录：显示登录入口链接
            <Link
              href="/login"
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
            >
              <User size={16} />
              <span>登录</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
