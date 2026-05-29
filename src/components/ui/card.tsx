/**
 * Card 卡片容器组件
 *
 * 用于承载内容块的通用卡片组件，属于 UI 基础组件库的一部分。
 * 提供统一的圆角、边框、白色背景样式，适用于产品卡片、信息面板、统计数据展示等场景。
 * 通过 props 透传支持所有原生 div 属性，可作为链接、按钮等元素的包装容器。
 *
 * @module components/ui/card
 */

import { cn } from '@/lib/utils';

/**
 * Card 卡片容器组件
 *
 * 渲染一个带有统一样式的 HTML div 元素。
 * 默认带有圆角边框（rounded-xl）、灰色边框和白色背景。
 *
 * @param props - 卡片属性，包含 className、children 及所有原生 div 属性
 */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-gray-200 bg-white', className)}
      {...props} // 透传所有原生 div 属性
    >
      {children}
    </div>
  );
}
