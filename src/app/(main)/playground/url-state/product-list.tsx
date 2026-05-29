type Product = { id: string; name: string; category: string };

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="py-8 text-center text-gray-400">没有匹配的产品</p>;
  }
  return (
    <ul className="divide-y">
      {products.map(p => (
        <li key={p.id} className="flex items-center justify-between py-2">
          <span className="font-medium">{p.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">{p.category}</span>
        </li>
      ))}
    </ul>
  );
}
