/**
 * StatsCard 统计卡片组件
 *
 * 属于后台管理模块（admin）的仪表盘子组件。
 * 用于在管理后台首页展示关键业务指标，如总销售额、订单数、用户数等。
 * 基于 Card 组件封装，包含标题、大数值和可选的辅助描述文字。
 *
 * @module components/admin/stats-card
 */

import { Card } from '@/components/ui/card';

/**
 * StatsCard 组件的 Props 类型
 */
type StatsCardProps = {
  /** 统计指标的标题，如"总销售额"、"订单数" */
  title: string;
  /** 统计指标的数值，以字符串形式展示（支持格式化后的数字） */
  value: string;
  /** 辅助描述文字，选填；如"较上月增长 12%" */
  description?: string;
};

/**
 * StatsCard 统计卡片组件
 *
 * 展示单个关键指标的数据卡片。
 * 布局：顶部小号灰色标题 -> 中间大号加粗数值 -> 底部可选小号描述。
 *
 * @param props - 统计卡片属性
 */
export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card className="p-6">
      {/* 指标标题：小号灰色文字 */}
      <p className="text-sm text-gray-500">{title}</p>
      {/* 指标数值：大号加粗文字 */}
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {/* 辅助描述：仅在 description 存在时渲染 */}
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
    </Card>
  );
}
