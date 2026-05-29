/**
 * StatusBadge 订单状态徽标组件
 *
 * 属于后台管理模块（admin）的订单管理子组件。
 * 将订单的状态码（如 PENDING、PAID、SHIPPED 等）映射为颜色语义化的 Badge 组件展示。
 * 状态颜色映射规则：
 * - PENDING（待处理）-> warning（黄色）
 * - PAID（已支付）-> success（绿色）
 * - PROCESSING（处理中）-> default（灰色）
 * - SHIPPED（已发货）-> warning（黄色）
 * - DELIVERED（已送达）-> success（绿色）
 * - CANCELLED（已取消）-> danger（红色）
 *
 * 状态显示文字通过 ORDER_STATUSES 常量映射为中文，未匹配时回退显示原始状态码。
 *
 * @module components/admin/status-badge
 */

import { Badge } from '@/components/ui/badge';
import { ORDER_STATUSES } from '@/lib/constants';

/**
 * 订单状态码到 Badge 颜色变体的映射表
 * 使用语义色区分不同状态的重要程度和含义
 */
const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',    // 待处理 - 黄色警告
  PAID: 'success',       // 已支付 - 绿色成功
  PROCESSING: 'default', // 处理中 - 灰色默认
  SHIPPED: 'warning',    // 已发货 - 黄色警告
  DELIVERED: 'success',  // 已送达 - 绿色成功
  CANCELLED: 'danger',   // 已取消 - 红色危险
};

/**
 * StatusBadge 订单状态徽标组件
 *
 * 根据订单状态码展示对应颜色和中文文字的 Badge。
 * 如果状态码未在映射表中（如未知状态），使用 default 灰色变体并直接显示原始状态码。
 *
 * @param props - 状态徽标属性
 * @param props.status - 订单状态码（如 PENDING、PAID 等）
 */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] || 'default'}>
      {/* 从 ORDER_STATUSES 常量中查找状态对应的中文显示文字，未匹配时回退显示原始状态码 */}
      {ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status}
    </Badge>
  );
}
