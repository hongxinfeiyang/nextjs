/**
 * 编辑商品页面
 *
 * 【文件职责】
 * - 根据动态路由参数 [id] 获取指定商品数据
 * - 将商品数据传递给客户端表单组件 EditProductForm 进行编辑
 *
 * 【鉴权要求】
 * - 由父级 (admin)/layout.tsx 统一鉴权
 *
 * 【错误处理】
 * - 商品不存在时调用 notFound() 触发 Next.js 的 404 页面
 */
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { EditProductForm } from './edit-form';

export const metadata = { title: '编辑商品' };

/** 页面参数类型：从动态路由 [id] 中解析 */
type Props = { params: Promise<{ id: string }> };

/**
 * 编辑商品页面组件
 *
 * 服务端组件，负责获取商品数据并渲染编辑表单。
 * @param props - 包含动态路由参数 params
 */
export default async function EditProductPage({ params }: Props) {
  // Next.js 15 中 params 为 Promise，需要 await 解析
  const { id } = await params;

  // 根据 ID 查找商品，不存在则返回 404
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  return <EditProductForm product={product} />;
}
