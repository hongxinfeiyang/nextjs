/**
 * AdminSidebar 后台管理侧边栏组件
 *
 * 属于后台管理模块（admin）的布局组件，固定在后台页面左侧。
 * 提供三个核心导航入口：仪表盘、商品管理、订单管理。
 * 当前激活的菜单项高亮显示（蓝色背景），支持：
 * - 精确匹配：如 /admin 匹配仪表盘
 * - 前缀匹配：如 /admin/products/xxx 匹配商品管理（非 /admin 的路由）
 * 底部包含"返回商城"的链接快捷入口。
 *
 * @module components/admin/admin-sidebar
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

/**
 * 侧边栏导航链接配置
 * 每个链接包含路由路径、显示文字和对应的 Lucide 图标组件
 */
const links = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/products', label: '商品管理', icon: Package },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingBag },
];

/**
 * AdminSidebar 后台管理侧边栏组件
 *
 * 使用 usePathname 获取当前路由，通过精确匹配或前缀匹配判断激活菜单。
 * 布局分为三部分：顶部 Logo、中部导航菜单、底部返回商城链接。
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* 顶部 Logo 区域 */}
      <div className="border-b border-gray-200 p-4">
        <Link href="/admin" className="text-lg font-bold text-blue-600">
          ShopNext 后台
        </Link>
      </div>

      {/* 中部导航菜单 */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          /**
           * 判断当前路由是否匹配该导航项：
           * - /admin 精确匹配仪表盘
           * - 其他路由使用前缀匹配（如 /admin/products/123 匹配商品管理）
           */
          const isActive = pathname === link.href ||
            (link.href !== '/admin' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                // 激活状态：蓝色背景 + 蓝色文字 + 加粗
                isActive
                  ? 'bg-blue-50 font-medium text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部操作区：返回商城入口 */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href="/shop"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ChevronRight size={14} />
          返回商城
        </Link>
      </div>
    </aside>
  );
}
