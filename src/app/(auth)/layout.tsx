/**
 * 认证路由组布局组件（AuthLayout）
 *
 * 【文件职责】
 * - 为 (auth) 路由组下的所有页面（登录、注册等）提供统一的布局容器
 *
 * 【鉴权要求】
 * - 无需鉴权：未登录用户可自由访问此布局内的页面
 *
 * 【布局说明】
 * - 垂直水平居中子页面内容
 * - 使用浅灰色背景，提供居中的卡片式布局体验
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/* 子页面内容：登录/注册表单等 */}
      {children}
    </div>
  );
}
