'use client';

import { useState, useEffect } from 'react';
import { fetchMockProducts } from '@/lib/playground-data';

export function ClientSWRList() {
  const [products, setProducts] = useState<Awaited<ReturnType<typeof fetchMockProducts>>>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchMockProducts();
    setProducts(data);
    setLastFetch(new Date().toLocaleTimeString('zh-CN'));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // 10 秒自动刷新
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">客户端 fetch + 10 秒自动刷新（模拟 SWR）</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">最后刷新: {lastFetch}</span>
          <button
            onClick={load}
            disabled={loading}
            className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {loading ? '刷新中...' : '手动刷新'}
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">名称</th><th className="pb-2 text-right">价格</th><th className="pb-2 text-right">库存</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 font-medium">{p.name}</td>
              <td className="py-2 text-right">¥{p.price}</td>
              <td className="py-2 text-right">{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
