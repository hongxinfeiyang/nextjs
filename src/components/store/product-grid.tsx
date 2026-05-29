/**
 * ProductGrid 商品网格布局组件
 *
 * 属于商城模块（store）的商品列表布局子组件。
 * 提供一个响应式的 CSS Grid 容器，用于排列商品卡片。
 * 在不同屏幕尺寸下自动调整列数：
 * - 移动端（默认）：2 列
 * - 小屏（sm）：3 列
 * - 大屏（lg）：4 列
 *
 * @module components/store/product-grid
 */

/**
 * ProductGrid 商品网格布局组件
 *
 * 使用 CSS Grid 实现响应式商品列表布局。
 * 通过 children 接收任意子节点，典型用法是包裹多个 ProductCard 组件。
 *
 * @param props - 组件属性
 * @param props.children - 网格内的子元素，通常为 ProductCard 组件数组
 */
export function ProductGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}
