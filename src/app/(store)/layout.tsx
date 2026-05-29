/**
 * 商城路由组 (store) 的共享布局组件
 *
 * 职责：
 * - 提供商城页面统一的页面结构（页头 + 内容区 + 页脚）
 * - 该布局被 (store) 路由组下所有页面自动继承，无需在每个页面中重复引入
 *
 * 路由组说明：
 * - (store) 是 Next.js 路由组（Route Group），括号内的名称不影响 URL 路径
 * - 所有 /shop/* 路径的页面都会使用此布局
 */

import { StoreHeader } from '@/components/store/store-header';
import { StoreFooter } from '@/components/store/store-footer';

/**
 * StoreLayout — 商城路由组根布局
 *
 * 采用 flex 纵向布局，确保页脚始终被推至页面底部（min-h-screen + flex-1）
 *
 * @param children - 子路由对应的页面内容，由 Next.js 自动注入
 */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 商城顶部导航栏（商品分类、购物车、搜索等） */}
      <StoreHeader />
      {/* 主内容区域，flex-1 使其撑满剩余空间，将页脚推至底部 */}
      <main className="flex-1">{children}</main>
      {/* 商城底部信息栏 */}
      <StoreFooter />
    </div>
  );
}
