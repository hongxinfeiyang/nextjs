/**
 * Input 输入框组件
 *
 * 基于原生 HTML input 封装的通用输入框组件，属于 UI 基础组件库的一部分。
 * 提供统一的边框、聚焦态、圆角等视觉样式，通过 props 透传支持所有原生 input 属性。
 * 适用于表单中的文本输入、搜索、密码等所有 input 类型场景。
 *
 * @module components/ui/input
 */

import { cn } from '@/lib/utils';

/**
 * Input 组件的 Props 类型
 * 完全继承原生 input 的所有 HTML 属性，不额外扩展字段
 */
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input 通用输入框组件
 *
 * 渲染一个带有统一样式的 HTML input 元素。
 * 默认宽度 100%，聚焦时显示蓝色边框和环形阴影。
 *
 * @param props - 输入框属性，包含 className 及所有原生 input 属性
 */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        // 基础样式：全宽、圆角、边框、内边距、文字大小
        // 聚焦态：蓝色边框 + 蓝色环形阴影（ring），过渡动画
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
        className, // 允许外部传入额外的自定义类名
      )}
      {...props} // 透传所有原生 input 属性（如 placeholder、type、value、onChange 等）
    />
  );
}
