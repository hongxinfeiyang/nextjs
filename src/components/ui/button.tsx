/**
 * Button 按钮组件
 *
 * 基于原生 HTML button 封装的通用按钮组件，属于 UI 基础组件库的一部分。
 * 提供 primary / secondary / outline / ghost / destructive 五种视觉变体，
 * 以及 sm / md / lg 三种尺寸，支持所有原生 button 属性透传。
 *
 * @module components/ui/button
 */

import { cn } from '@/lib/utils';

/**
 * Button 组件的 Props 类型
 * 继承原生 button 的所有 HTML 属性，同时扩展 variant 和 size 控制样式
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 按钮样式变体，控制颜色和边框风格 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** 按钮尺寸，控制内边距和文字大小 */
  size?: 'sm' | 'md' | 'lg';
};

/** 各变体对应的 Tailwind CSS 类名映射 */
const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  outline: 'border border-gray-300 hover:bg-gray-50',
  ghost: 'hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

/** 各尺寸对应的 Tailwind CSS 类名映射 */
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Button 通用按钮组件
 *
 * 渲染一个带有统一样式系统的 HTML button 元素。
 * 默认使用 primary 变体和 md 尺寸，可通过 props 覆盖。
 * 支持 disabled 状态（半透明 + 禁止点击光标）。
 *
 * @param props - 按钮属性，包含 variant、size 及所有原生 button 属性
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // 基础样式：flex 布局、居中对齐、圆角、字重、过渡动画
        // disabled 状态：半透明 + 禁止点击光标
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], // 根据 variant 应用对应颜色样式
        sizes[size],       // 根据 size 应用对应尺寸样式
        className,         // 允许外部传入额外的自定义类名
      )}
      {...props} // 透传所有原生 button 属性（如 onClick、type、disabled 等）
    />
  );
}
