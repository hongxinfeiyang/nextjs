/**
 * ProductCard 商品卡片组件
 *
 * 属于商城模块（store）的商品列表子组件。
 * 展示单个商品的关键信息：图片、分类标签、名称、价格和对比价格。
 * 整个卡片是一个可点击的 Link，点击后跳转至商品详情页。
 * 当商品无图片时显示默认的包裹 emoji 占位。
 *
 * @module components/store/product-card
 */

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * ProductCard 组件的 Props 类型
 */
type ProductCardProps = {
  /** 商品唯一标识 ID */
  id: string;
  /** 商品名称 */
  name: string;
  /** 商品当前售价 */
  price: number;
  /** 商品原价/对比价格，用于展示划线价，选填 */
  comparePrice?: number | null;
  /** 商品图片 URL，选填；不提供时显示默认 emoji 占位 */
  image?: string;
  /** 商品所属分类，显示为卡片上的 Badge 标签 */
  category: string;
  /** 商品库存数量（当前未直接用于展示，可供后续扩展，如需显示库存状态） */
  stock: number;
};

/**
 * ProductCard 商品卡片组件
 *
 * 以 Link 包裹 Card 组件，实现整卡可点击跳转。
 * 卡片包含：
 * - 正方形图片区域（渐变色背景占位，有图片时显示真实图片）
 * - 分类 Badge 标签
 * - 商品名称（最多两行截断，hover 变蓝色）
 * - 价格和原价对比（原价带删除线）
 *
 * @param props - 商品卡片属性
 */
export function ProductCard({
  id,
  name,
  price,
  comparePrice,
  image,
  category,
}: ProductCardProps) {
  return (
    <Link href={`/shop/products/${id}`}>
      {/* group 类名用于子元素响应 hover 状态 */}
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        {/* 商品图片区域：保持 1:1 正方形比例 */}
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            // 无图片时的默认占位符
            '📦'
          )}
        </div>
        {/* 商品信息区域 */}
        <div className="p-4">
          {/* 分类标签 */}
          <Badge variant="default" className="mb-2">
            {category}
          </Badge>
          {/* 商品名称：最多显示两行，hover 时变蓝色 */}
          <h3 className="mb-2 line-clamp-2 font-medium text-gray-800 group-hover:text-blue-600">
            {name}
          </h3>
          {/* 价格行 */}
          <div className="flex items-baseline gap-2">
            {/* 当前售价：红色加粗 */}
            <span className="text-lg font-bold text-red-500">
              &yen;{price.toFixed(2)}
            </span>
            {/* 原价/对比价：灰色删除线，仅在 comparePrice 存在时显示 */}
            {comparePrice && (
              <span className="text-sm text-gray-400 line-through">
                &yen;{comparePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
