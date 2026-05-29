# 第六章：状态管理与客户端交互

---

## 6.1 `'use client'` 边界的深度理解

### "客户端组件" 不等于 "只在客户端运行"

```
'use client' 组件的生命周期：

服务端（首次渲染）：
  ├─ 执行组件代码（生成初始 HTML / RSC Payload）
  ├─ 序列化 props 和状态
  └─ 发送给浏览器

客户端（水化后）：
  ├─ React hydrate（接管 DOM）
  ├─ 绑定事件处理器
  └─ 后续渲染完全在客户端
```

```tsx
'use client';

import { useState } from 'react';

export function ClientOnly() {
  const [count, setCount] = useState(0);
  // 首次：服务端渲染 count=0 的 HTML
  // 水化后：点击按钮时在客户端更新
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 传递服务端数据到客户端

```tsx
// src/app/page.tsx — 服务端组件
import { ClientProductList } from './client-product-list';

export default async function HomePage() {
  // 服务端获取数据
  const products = await db.product.findMany();

  // ✅ 通过 props 把序列化数据传给客户端组件
  return <ClientProductList products={products} />;
}
```

```tsx
// src/app/client-product-list.tsx
'use client';

import { useState } from 'react';

export function ClientProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('');
  // products 被 Next.js 自动序列化并嵌入 HTML 中

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="筛选..."
      />
      {filtered.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

> **限制：** 传给客户端组件的 props 必须是可序列化的（不能传 functions、Date 对象、类实例等）。

---

## 6.2 URL 作为状态源

在 Next.js 中，URL 是存储页面状态的天然位置。这也符合 "服务端优先" 的思想 —— URL 参数可以直接被服务端组件读取。

### `useSearchParams` — 读取 URL 参数

```tsx
// src/app/products/page.tsx — 服务端组件
type Props = { searchParams: Promise<{ q?: string; page?: string; sort?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { q = '', page = '1', sort = 'newest' } = await searchParams;

  // 服务端直接使用 URL 参数查询数据
  const products = await db.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: sort === 'price' ? { price: 'asc' } : { createdAt: 'desc' },
    take: 12,
    skip: (Number(page) - 1) * 12,
  });

  return <ProductGrid products={products} />;
}
```

```tsx
// src/app/products/search.tsx — 客户端组件
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    params.set('page', '1'); // 搜索时重置页码
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <input
      defaultValue={searchParams.get('q')?.toString()}
      onChange={e => handleSearch(e.target.value)}
      placeholder="搜索产品..."
      className="border p-2"
    />
  );
}
```

### `Suspense` 包裹 `useSearchParams` 的必要性

```tsx
// ❌ 坏：会导致整个页面变成客户端渲染
export default function ProductsPage() {
  return <SearchInput />; // 内部用了 useSearchParams
}

// ✅ 好：用 Suspense 隔离
import { Suspense } from 'react';

export default function ProductsPage() {
  return (
    <div>
      <Suspense fallback={<SearchSkeleton />}>
        <SearchInput />
      </Suspense>
      {/* 其它部分仍然是服务端渲染 */}
      <ProductGrid />
    </div>
  );
}
```

> **Next.js 15 重要变更：** `useSearchParams`、`useParams`、`usePathname` 等 hooks 要求用 `Suspense` 包裹，否则会触发警告。

### URL 状态的优点

| 对比 | URL 状态 | React State |
|------|---------|-------------|
| 可分享 | ✅ 复制链接即分享 | ❌ |
| SSR 可用 | ✅ 服务端直接读取 | ❌ |
| 浏览器前进后退 | ✅ 原生支持 | ❌ 需手动处理 |
| 持久化 | ✅ 书签 | ❌ 刷新丢失 |
| 适用场景 | 搜索、筛选、分页 | 临时 UI 状态 |

---

## 6.3 Context API 与服务端数据的桥梁

### 模式：服务端读数据 → Context 分发

```tsx
// src/lib/user-context.tsx
'use client';

import { createContext, useContext } from 'react';

type User = { id: string; name: string; email: string };

const UserContext = createContext<User | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (user === undefined) throw new Error('useUser must be used within UserProvider');
  return user;
}
```

```tsx
// src/app/layout.tsx — 服务端
import { getUser } from '@/lib/auth';
import { UserProvider } from '@/lib/user-context';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser(); // 服务端读取 session

  return (
    <html lang="zh-CN">
      <body>
        <UserProvider user={user}>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
```

```tsx
// 任意客户端组件
'use client';

import { useUser } from '@/lib/user-context';

export function UserAvatar() {
  const user = useUser();
  if (!user) return <a href="/login">登录</a>;
  return <span>{user.name}</span>;
}
```

---

## 6.4 全局状态管理

对于复杂的客户端状态（购物车、多步骤表单等），可以使用 Zustand 或 Jotai。

### Zustand 集成

```bash
npm install zustand
```

```tsx
// src/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  totalPrice: () => number;
  totalItems: () => number;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map(i =>
                i.productId === productId ? { ...i, quantity } : i,
              )
            : state.items.filter(i => i.productId !== productId),
        })),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart-storage' }, // 自动同步到 localStorage
  ),
);
```

```tsx
// 组件中使用
'use client';

import { useCartStore } from '@/stores/cart-store';

export function CartButton() {
  const totalItems = useCartStore(s => s.totalItems());

  return (
    <a href="/cart" className="relative">
      购物车
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
          {totalItems}
        </span>
      )}
    </a>
  );
}
```

### Zustand 与服务端数据同步

```tsx
// src/stores/product-store.ts — 结合 SWR 的服务端数据 + Zustand 的 UI 状态
import { create } from 'zustand';
import useSWR from 'swr';

// Zustand 只管理 UI 状态
export const useProductFilters = create<{
  category: string;
  sort: string;
  setCategory: (c: string) => void;
  setSort: (s: string) => void;
}>(...);

// SWR 管理服务端数据
export function useProducts() {
  const { category, sort } = useProductFilters();
  return useSWR(`/api/products?category=${category}&sort=${sort}`);
}
```

---

## 6.5 表单交互模式

### 模式一：非受控表单 + Server Action（推荐）

```tsx
// ✅ 最简单、性能最好 — form 原生行为 + Server Action
export default function SimpleForm() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 模式二：受控表单（需要实时校验/联动）

```tsx
'use client';

import { useState } from 'react';

export function ControlledForm() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name) errs.name = '请输入姓名';
    if (!form.email.includes('@')) errs.email = '邮箱格式不对';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await createUser(form); // Server Action
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />
      {errors.name && <p className="text-red-500">{errors.name}</p>}

      <input
        value={form.email}
        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
      />
      {errors.email && <p className="text-red-500">{errors.email}</p>}

      <button type="submit">提交</button>
    </form>
  );
}
```

### 模式三：React Hook Form + Zod

```bash
npm install react-hook-form @hookform/resolvers zod
```

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUser } from '@/app/actions';

const schema = z.object({
  name: z.string().min(1, '请输入姓名'),
  email: z.string().email('邮箱格式不正确'),
});

type FormData = z.infer<typeof schema>;

export function HookForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}

      <input {...register('email')} />
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

---

## 6.6 动画与过渡

### `useTransition` — 标记非紧急更新

```tsx
'use client';

import { useTransition, useState } from 'react';

export function TabSwitcher() {
  const [tab, setTab] = useState('posts');
  const [isPending, startTransition] = useTransition();

  const switchTab = (nextTab: string) => {
    startTransition(() => {
      setTab(nextTab); // 非紧急更新 — React 会等待更紧急的更新先完成
    });
  };

  return (
    <div>
      <div className="flex gap-2">
        {['posts', 'comments', 'likes'].map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{ fontWeight: tab === t ? 'bold' : 'normal' }}
          >
            {t}
          </button>
        ))}
      </div>
      {/* 加载指示器 */}
      {isPending && <div className="h-1 animate-pulse bg-blue-500" />}
      {/* Tab 内容 */}
      <div style={{ opacity: isPending ? 0.6 : 1 }}>
        <TabContent tab={tab} />
      </div>
    </div>
  );
}
```

### 页面过渡动画

```tsx
// src/app/template.tsx — 使用 template 让每次切换重新挂载
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function PageTemplate({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={Math.random()} // 实际项目中建议用 pathname
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 6.7 第三方客户端的集成模式

### 集成 Apollo Client

```tsx
// src/lib/apollo-provider.tsx
'use client';

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

const client = new ApolloClient({
  link: new HttpLink({ uri: '/api/graphql' }),
  cache: new InMemoryCache(),
});

export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```

```tsx
// src/app/layout.tsx
import { ApolloClientProvider } from '@/lib/apollo-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ApolloClientProvider>
          {children}
        </ApolloClientProvider>
      </body>
    </html>
  );
}
```

### 集成模式总结

```
┌─────────────────────────────────────┐
│  RSC (服务端)                        │
│  ├─ 数据获取（DB / fetch）           │
│  ├─ 渲染                                │
│  │  ├─ 静态 HTML ──────────→ 浏览器  │
│  │  └─ 'use client' 组件 ──→ 序列化   │
│  └────────────────────────────────  │
│                                      │
│  Client Component (客户端)            │
│  ├─ 水化（hydrate）                  │
│  ├─ 绑定事件                         │
│  ├─ React State / Zustand           │
│  ├─ 第三方 Provider（Apollo 等）      │
│  └─ 浏览器 API                       │
└─────────────────────────────────────┘
```

---

:::demo url-params
:::

## 练习

1. 实现一个用 URL SearchParams 管理的产品搜索和分页功能
2. 用 Context 将服务端获取的用户信息传递给整个应用
3. 用 Zustand 实现一个带本地持久化的购物车
4. 用 React Hook Form + Zod 实现一个多步骤注册表单
5. 集成一个第三方库（如 Framer Motion）实现页面切换动画
