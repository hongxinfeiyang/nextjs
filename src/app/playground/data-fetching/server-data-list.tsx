import { fetchMockProducts } from '@/lib/playground-data';

export async function ServerDataList() {
  const products = await fetchMockProducts();

  return (
    <div className="rounded-xl border p-6">
      <p className="mb-3 text-xs text-gray-400">
        数据在服务端获取，包含在初始 HTML 中（查看源代码可验证）
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">名称</th><th className="pb-2">分类</th><th className="pb-2 text-right">价格</th><th className="pb-2 text-right">库存</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 font-medium">{p.name}</td>
              <td className="py-2 text-gray-500">{p.category}</td>
              <td className="py-2 text-right">¥{p.price}</td>
              <td className="py-2 text-right">{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
