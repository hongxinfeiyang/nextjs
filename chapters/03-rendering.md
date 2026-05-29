# 第三章：渲染策略 — SSR / SSG / ISR / CSR

---

Next.js 最核心的竞争力在于**混合渲染**能力。同一应用中，不同页面甚至不同组件可以使用不同的渲染策略。

## 3.1 渲染模式全景图

```
                    动态
                     ↑
            SSR      |     ISR
       (force-dynamic)|  (revalidate)
                      |
    ──────────────────┼────────────────── → 时间
                      |
            SSG       |     CSR
      (默认静态)       |  ('use client')
                      |
                    静态
```

### 四种模式对比

| 特性 | SSG | SSR | ISR | CSR |
|------|-----|-----|-----|-----|
| 渲染时机 | 构建时 | 请求时 | 构建时 + 按需更新 | 浏览器端 |
| 更新频率 | 重新构建 | 每次请求 | 按时间间隔 | 实时 |
| 首屏速度 | 极快 | 中等 | 极快 | 慢 |
| SEO | 优秀 | 优秀 | 优秀 | 差 |
| 适用场景 | 文档、博客 | 个性化内容 | 产品列表 | 后台管理 |
| 服务器负载 | 极低 | 中等 | 极低 | 无 |

---

## 3.2 服务端渲染 (SSR)

SSR 在每次请求时**动态**生成 HTML，适合需要实时数据、个性化内容的页面。

### 开启 SSR

有三种方式告诉 Next.js "这个页面每次请求都需要重新渲染"：

**方式一：** `dynamic = 'force-dynamic'`

```tsx
// src/app/dashboard/page.tsx
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await fetch('https://api.example.com/realtime-data', {
    cache: 'no-store', // 每次请求都重新获取
  }).then(r => r.json());

  return <div>{/* 渲染实时数据 */}</div>;
}
```

**方式二：** 使用 `cookies()` 或 `headers()`

```tsx
import { cookies } from 'next/headers';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // 因为使用了 cookies()，这个页面自动变成动态渲染
  const user = await fetch('https://api.example.com/me', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

  return <div>你好，{user.name}</div>;
}
```

> **规则：** 任何页面只要调用了 `cookies()`、`headers()`、`draftMode()`、`searchParams` (在 page 的 props 中)，就会自动降级为动态渲染。这被称为 **Dynamic APIs**。

**方式三：** 使用 `revalidate = 0`

```tsx
export const revalidate = 0; // 等同于 force-dynamic
```

---

## 3.3 静态生成 (SSG)

SSG 在**构建时**将页面预渲染为静态 HTML，直接部署到 CDN，速度最快。

### 默认行为

Next.js 15 的默认行为是**尽可能静态化**：如果页面不使用 Dynamic APIs，就会被静态生成。

```tsx
// src/app/about/page.tsx
// 没有 cookies()、headers() 等 → 自动 SSG
export default function AboutPage() {
  return <h1>关于我们</h1>;
}
```

### 使用 `generateStaticParams`

对于动态路由，需要告诉 Next.js 有哪些路径可以静态生成：

```tsx
// src/app/blog/[slug]/page.tsx
type Props = { params: Promise<{ slug: string }> };

// 构建时调用 → 返回所有需要预渲染的路径
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

构建后的产物：

```
.next/server/app/blog/
├── hello-world.html     ← 预渲染的静态 HTML
├── nextjs-guide.html    ← 预渲染的静态 HTML
└── [slug].html          ← 未在 generateStaticParams 中的路径
                           → 请求时动态生成（相当于 ISR fallback）
```

### 强制静态化

```tsx
export const dynamic = 'force-static';
```

---

## 3.4 增量静态再生 (ISR)

ISR 是 SSG + 按时间间隔更新的混合模式。页面先静态生成，过了 `revalidate` 时间后，下一次请求会触发后台重新生成。

### 基于时间的 ISR

```tsx
// src/app/products/page.tsx
// 页面构建时静态生成，每 60 秒后台重新生成一次
export const revalidate = 60;

export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products').then(r => r.json());

  return (
    <ul>
      {products.map((p: { id: string; name: string; price: number }) => (
        <li key={p.id}>{p.name} - ¥{p.price}</li>
      ))}
    </ul>
  );
}
```

### ISR 的工作流程（Stale-While-Revalidate）

```
时间线：
T=0s   用户A请求 → 命中缓存 → 返回旧的静态版本 (stale)
T=0s   同时触发后台重新生成 (revalidate)
T=10s  用户B请求 → 命中旧缓存 → 仍返回旧版本（如果后台还未生成完）
T=12s  后台生成完成 → 更新缓存
T=15s  用户C请求 → 命中新缓存 → 返回新版本
T=60s  用户D请求 → 缓存过期 → 重复以上流程
```

### 基于标签的按需 ISR (On-Demand Revalidation)

更灵活的方案：不依赖时间，而是**主动通知** Next.js"某个内容变了"：

```tsx
// src/app/posts/[slug]/page.tsx
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetch(`https://cms.example.com/posts/${slug}`, {
    next: {
      tags: ['posts', `post-${slug}`], // 打标签
    },
  }).then(r => r.json());

  return <article>{post.content}</article>;
}
```

```ts
// src/app/api/revalidate/route.ts — Webhook 入口
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // 验证 secret，防止恶意调用
  if (body.secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  // 按标签触发重新验证
  revalidateTag('posts');
  revalidateTag(`post-${body.slug}`);

  return NextResponse.json({ revalidated: true });
}
```

当 CMS 内容更新后发送 Webhook → 调用 `/api/revalidate` → 精确地让相关页面失效。

---

## 3.5 客户端渲染 (CSR)

### `'use client'` 边界

```tsx
'use client'; // ← 标记为客户端组件

import { useState, useEffect } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then(r => r.json())
      .then(setResults);

    return () => controller.abort();
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border p-2"
        placeholder="搜索..."
      />
      <ul>
        {results.map((r: { id: string; title: string }) => (
          <li key={r.id}>{r.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### `'use client'` 重要认知

```
┌──────────────────────────────────────────┐
│  Server (RSC)                            │
│  ┌────────────────────────────────────┐  │
│  │  'use client' 边界                  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  可以用的：                    │  │  │
│  │  │  - useState / useEffect       │  │  │
│  │  │  - onClick / onChange         │  │  │
│  │  │  - Browser APIs (localStorage)│  │  │
│  │  │  - 第三方客户端库             │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│  服务端组件可以直接 async/await          │
│  可以直接访问数据库、文件系统            │
└──────────────────────────────────────────┘
```

**关键原则：** 把 `'use client'` 边界推得越低越好（树叶组件），让尽可能多的代码留在服务端。

```tsx
// ✅ 好：只有交互部分标记为客户端
// src/app/products/page.tsx

// 服务端组件 — 负责数据获取
import { ProductList } from './product-list';
import { AddToCartButton } from './add-to-cart-button';

export default async function ProductsPage() {
  const products = await db.product.findMany();
  return <ProductList products={products} />;
}

// src/app/products/product-list.tsx — 服务端组件（可传数据给客户端子组件）
import { ProductCard } from './product-card';

export function ProductList({ products }) {
  return (
    <div className="grid grid-cols-3">
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

// src/app/products/add-to-cart-button.tsx
'use client'; // ← 只有按钮需要客户端交互

export function AddToCartButton({ productId }: { productId: string }) {
  return (
    <button onClick={() => addToCart(productId)}>
      加入购物车
    </button>
  );
}
```

---

## 3.6 部分预渲染 (Cache Components)

Next.js 16 将 PPR 正式合并到了 **`cacheComponents`** 体系中，允许**同一个页面**中既有静态部分又有动态部分。不再使用 `experimental_ppr` 标志。

```tsx
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true, // Next.js 16：替代 experimental.ppr
};

export default nextConfig;
```

```tsx
// src/app/page.tsx
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <div>
      {/* 静态外壳 — 构建时预渲染，进入 CDN */}
      <header>
        <h1>我的商店</h1>
        <nav>...</nav>
      </header>

      {/* 动态部分 — 请求时通过 Suspense 流式注入 */}
      <Suspense fallback={<CartSkeleton />}>
        <ShoppingCart />
      </Suspense>
    </div>
  );
}
```

Cache Components 工作流：
```
构建时：
  [静态外壳：Header + Nav + Footer] → CDN

请求时：
  CDN 立即返回静态外壳
  + 同时渲染 <ShoppingCart /> 动态内容
  + 流式传输到浏览器
```

---

## 3.7 选择渲染策略的决策树

```
这个页面需要什么？
  │
  ├─ 所有用户看到的内容都一样？
  │   └─ 内容多久更新一次？
  │       ├─ 几乎不变（文档、帮助页） → SSG
  │       ├─ 定期更新（博客、产品列表） → ISR (revalidate)
  │       └─ 随时可能更新 → On-demand ISR
  │
  ├─ 每个用户看到的内容不同？
  │   └─ 内容需要多"实时"？
  │       ├─ 必须实时（仪表盘、管理后台）→ SSR (force-dynamic)
  │       └─ 可以接受几秒延迟 → ISR + 客户端 SWR
  │
  ├─ SEO 不重要？
  │   └─ 纯交互应用（内部工具、应用内页面）→ CSR
  │
  └─ 既有静态部分又有动态部分？
      └─ 使用 cacheComponents + Suspense 实现部分预渲染
```

### 实战决策表示例

| 页面类型 | 推荐策略 | 配置 |
|---------|---------|------|
| 首页 | ISR | `revalidate = 3600` |
| 博客文章 | SSG + On-demand ISR | `generateStaticParams` + `revalidateTag` |
| 产品详情 | ISR | `revalidate = 60` |
| 用户仪表盘 | SSR | `dynamic = 'force-dynamic'` |
| 设置页面 | CSR | `'use client'` + SWR |
| 搜索结果 | CSR | `'use client'` + debounce fetch |
| 管理后台 | CSR | 完全客户端 |
| 落地页 | SSG | 默认静态 |

---

## 本章核心概念回顾

| 概念 | 一句话 |
|------|--------|
| SSG | 构建时生成静态 HTML，速度最快 |
| SSR | 每次请求动态渲染，数据最新但服务器有压力 |
| ISR | 静态生成 + 定时刷新，兼顾速度与新鲜度 |
| CSR | 浏览器端渲染，适合不需要 SEO 的交互应用 |
| On-demand ISR | 事件驱动的缓存失效，最灵活 |
| PPR / Cache Components | 同一页面混合静态和动态，Next.js 16 通过 cacheComponents 启用 |
| Dynamic APIs | `cookies()` / `headers()` 等会自动触发动态渲染 |

---

:::demo rendering
:::

## 练习

1. 创建三个页面分别使用 SSG、SSR、ISR，观察 `next build` 输出中三者的差异（查看 ○ / λ / ● 标记）
2. 配置 `revalidate = 30` 的产品页面，观察 30 秒后刷新是否拿到新数据
3. 使用 `revalidateTag` 实现一个按需 ISR 的 Webhook 接口
4. 将一个页面拆分为服务端父组件 + 客户端叶子组件
