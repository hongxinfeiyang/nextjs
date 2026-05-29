import Link from 'next/link';
import { Code2, Route, Server, Database, FormInput, Search, Palette, ShoppingCart, Languages } from 'lucide-react';

const demos = [
  { href: '/playground/counter', icon: Code2, title: '计数器 & 交互', desc: 'useState / useEffect / Client Component 基础交互', ch: '1' },
  { href: '/playground/routing', icon: Route, title: '动态路由', desc: '[id] / catch-all / generateStaticParams / loading / error', ch: '2' },
  { href: '/playground/rendering', icon: Server, title: '渲染策略', desc: 'SSR vs SSG vs ISR 实时对比', ch: '3' },
  { href: '/playground/data-fetching', icon: Database, title: '数据获取', desc: 'Server fetch / SWR / 乐观更新 / 分页', ch: '4' },
  { href: '/playground/server-actions', icon: FormInput, title: 'Server Actions', desc: '表单提交 / Zod 校验 / useFormStatus', ch: '5' },
  { href: '/playground/url-state', icon: Search, title: 'URL 状态管理', desc: '搜索 / 筛选 / 分页 全部走 URL 参数', ch: '6' },
  { href: '/playground/styling', icon: Palette, title: '样式 & 主题', desc: 'Button 变体 (cva) / 暗色模式切换 / 响应式', ch: '7' },
  { href: '/playground/cart', icon: ShoppingCart, title: 'Zustand 购物车', desc: '全局状态 / 本地持久化 / 加减删', ch: '6/12' },
  { href: '/playground/i18n', icon: Languages, title: '国际化 (i18n)', desc: '中/英/日 三语切换', ch: '13' },
];

export default function PlaygroundPage() {
  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-extrabold">Playground</h1>
        <p className="mb-8 text-gray-500">
          以下 Demo 覆盖了教程中的核心概念，每个都可独立运行和交互。
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map(d => (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-xl border p-5 transition-all hover:border-brand hover:shadow-md"
            >
              <d.icon size={28} className="mb-3 text-brand" />
              <span className="mb-1 block text-xs font-medium text-brand">第 {d.ch} 章</span>
              <h3 className="mb-1 font-semibold group-hover:text-brand">{d.title}</h3>
              <p className="text-sm text-gray-500">{d.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
