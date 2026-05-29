/**
 * StoreFooter 商城底部组件
 *
 * 属于商城模块（store）的布局组件，位于页面底部。
 * 展示版权信息（固定年份 2026）和"返回学习文档"的导航链接。
 * 使用 mt-auto 自动推至页面底部，适用于 flex 布局的页面容器。
 *
 * @module components/store/store-footer
 */

import Link from 'next/link';

/**
 * StoreFooter 商城底部组件
 *
 * 渲染一个包含版权声明和返回文档链接的简洁页脚。
 * 背景为浅灰色（bg-gray-50），内容居中显示。
 */
export function StoreFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
        {/* 版权信息 */}
        <p>&copy; 2026 ShopNext. 学习项目，仅供演示。</p>
        {/* 返回学习文档的链接 */}
        <p className="mt-1">
          <Link href="/" className="hover:text-blue-600">
            返回学习文档
          </Link>
        </p>
      </div>
    </footer>
  );
}
