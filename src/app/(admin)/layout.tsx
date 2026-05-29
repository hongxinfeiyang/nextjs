/**
 * 管理后台路由组布局组件（AdminLayout）
 *
 * 【文件职责】
 * - 为 (admin) 路由组下的所有管理页面提供统一的布局框架（侧边栏 + 主内容区）
 *
 * 【鉴权要求】
 * - 严格鉴权：必须是已登录且角色为 ADMIN 的用户
 * - 未登录或非管理员用户将被重定向到 /shop（商城首页）
 *
 * 【布局说明】
 * - 左侧固定 AdminSidebar 侧边导航栏
 * - 右侧为子页面的主内容区域
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

/**
 * 管理后台布局组件
 *
 * 服务端组件，在渲染前进行身份校验：
 * 1. 获取当前会话信息
 * 2. 检查用户是否存在且角色为 ADMIN
 * 3. 不满足条件则重定向到商城首页
 * 4. 满足条件则渲染管理后台界面
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 通过 auth 实例获取当前用户会话
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 鉴权：非管理员用户重定向到商城首页
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/shop');
  }

  return (
    <div className="flex min-h-screen">
      {/* 左侧管理侧边栏导航 */}
      <AdminSidebar />
      {/* 右侧主内容区域 */}
      <main className="flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}
