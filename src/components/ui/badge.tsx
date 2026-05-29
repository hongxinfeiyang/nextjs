/**
 * Badge 徽标组件
 *
 * 用于展示状态标签、分类标记、计数等小型文本标识的 UI 基础组件。
 * 提供 default / success / warning / danger 四种颜色变体，
 * 分别对应灰、绿、黄、红四种语义色，适用于不同场景的状态传达。
 *
 * @module components/ui/badge
 */

import { cn } from '@/lib/utils';

/**
 * Badge 组件的 Props 类型
 */
type BadgeProps = {
  /** 徽标内显示的内容，通常为文字 */
  children: React.ReactNode;
  /** 颜色变体，控制背景和文字颜色，默认为 'default'（灰色） */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** 额外的自定义 CSS 类名 */
  className?: string;
};

/** 各变体对应的 Tailwind CSS 类名映射：控制背景色和文字色 */
const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
};

/**
 * Badge 徽标组件
 *
 * 渲染一个圆角药丸形状的 inline-flex 容器，常用于行内展示状态或分类信息。
 * 默认使用灰色背景的 default 变体。
 *
 * @param props - Badge 属性，包含 children、variant、className
 */
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        // 基础样式：inline-flex 布局、圆角药丸形状（rounded-full）、小号字体加粗
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant], // 根据 variant 应用对应颜色样式
        className,         // 允许外部传入额外的自定义类名
      )}
    >
      {children}
    </span>
  );
}
