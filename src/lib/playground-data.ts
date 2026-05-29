export async function fetchMockProducts() {
  // 模拟延迟
  await new Promise(r => setTimeout(r, 800));

  return [
    { id: '1', name: '机械键盘', price: 299, category: '电子产品', stock: 50 },
    { id: '2', name: 'Type-C 数据线', price: 29.9, category: '配件', stock: 200 },
    { id: '3', name: '显示器支架', price: 159, category: '办公', stock: 30 },
    { id: '4', name: '无线鼠标', price: 89, category: '电子产品', stock: 80 },
    { id: '5', name: '机械硬盘 2TB', price: 399, category: '存储', stock: 25 },
    { id: '6', name: 'USB 集线器', price: 49, category: '配件', stock: 120 },
  ];
}

export async function fetchMockProduct(id: string) {
  await new Promise(r => setTimeout(r, 500));
  const products = await fetchMockProducts();
  const product = products.find(p => p.id === id);
  if (!product) return null;
  return { ...product, description: `这是 ${product.name} 的详细描述。一款高品质的产品。` };
}

export function mockCategories() {
  return ['电子产品', '配件', '办公', '存储'];
}

export async function fetchMockUser() {
  await new Promise(r => setTimeout(r, 300));
  return { id: 'u1', name: '张三', email: 'zhangsan@example.com', avatar: '' };
}

export async function fetchMockPosts(page = 1) {
  await new Promise(r => setTimeout(r, 600));
  const all = Array.from({ length: 25 }, (_, i) => ({
    id: String(i + 1),
    title: `示例文章 #${i + 1}：Next.js 最佳实践指南`,
    excerpt: `这是第 ${i + 1} 篇文章的摘要内容...`,
    date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  }));
  const start = (page - 1) * 5;
  return { posts: all.slice(start, start + 5), total: all.length, page };
}
