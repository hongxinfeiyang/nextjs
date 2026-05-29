/**
 * EmptyState 空状态组件
 *
 * 用于在列表、表格等数据区域无数据时展示友好的空状态提示，属于 UI 基础组件库的一部分。
 * 包含一个默认的图标、标题文字、可选的描述文字以及可选的操作按钮（Link），
 * 适用于购物车为空、搜索结果为空、订单列表为空等场景。
 *
 * @module components/ui/empty-state
 */

import Link from 'next/link';

/**
 * EmptyState 组件的 Props 类型
 */
type EmptyStateProps = {
  /** 空状态的主标题，必填 */
  title: string;
  /** 空状态的辅助描述文字，选填 */
  description?: string;
  /** 操作按钮的显示文字，选填；与 actionHref 同时提供才会渲染按钮 */
  actionLabel?: string;
  /** 操作按钮的跳转链接，选填；与 actionLabel 同时提供才会渲染按钮 */
  actionHref?: string;
};

/**
 * EmptyState 空状态组件
 *
 * 居中展示空状态信息，包括图标、标题、可选描述和可选操作链接。
 * 当 actionLabel 和 actionHref 同时提供时，会渲染一个蓝色按钮链接引导用户操作。
 *
 * @param props - 空状态属性
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* 默认展示的包裹图标 emoji */}
      <div className="mb-4 text-6xl">📦</div>
      {/* 主标题 */}
      <h2 className="mb-2 text-xl font-semibold text-gray-700">{title}</h2>
      {/* 可选描述文字，仅在 description 存在时渲染 */}
      {description && (
        <p className="mb-6 max-w-sm text-gray-500">{description}</p>
      )}
      {/* 可选操作按钮，仅在 actionLabel 和 actionHref 同时存在时渲染 */}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
