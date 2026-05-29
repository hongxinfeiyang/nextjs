/**
 * Skeleton 骨架屏组件
 *
 * 用于内容加载中的占位展示，属于 UI 基础组件库的一部分。
 * 提供一个带有脉冲动画（animate-pulse）的灰色矩形块，
 * 可通过 className 自由控制宽高、圆角等尺寸和形状。
 * 常用于页面数据尚未加载完成时的 UI 占位。
 *
 * @module components/ui/skeleton
 */

import { cn } from '@/lib/utils';

/**
 * Skeleton 骨架屏组件
 *
 * 渲染一个带动画的灰色占位 div，模拟内容加载中的视觉效果。
 * 通过 className 传入 w-*、h-* 控制尺寸，rounded-* 控制圆角。
 *
 * @param props - 骨架屏属性
 * @param props.className - 额外的自定义 CSS 类名，用于控制尺寸和形状
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      // 基础样式：脉冲动画（animate-pulse）、圆角、灰色背景
      className={cn('animate-pulse rounded-lg bg-gray-200', className)}
    />
  );
}
