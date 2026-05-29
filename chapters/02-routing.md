# 第二章：路由系统 — App Router 详解

---

## 2.1 文件即路由

App Router 的核心思想：**文件系统即路由**。`app/` 目录下的每个文件夹（包含 `page.tsx`）自动映射为一个可访问的 URL 路径。

### 基础映射规则

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
├── blog/
│   ├── page.tsx          → /blog
│   └── [slug]/
│       └── page.tsx      → /blog/hello-world   (动态)
└── products/
    └── [category]/
        └── [id]/
            └── page.tsx  → /products/electronics/42
```

```tsx
// src/app/about/page.tsx
export default function AboutPage() {
  return <h1>关于我们</h1>;
}
```

只需在正确的位置创建文件和文件夹，无需任何路由配置。

### 元数据导出

每个 `page.tsx` 和 `layout.tsx` 都可以导出一个 `metadata` 对象：

```tsx
// src/app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们',
  description: '了解我们的团队和使命',
};

export default function AboutPage() {
  return <h1>关于我们</h1>;
}
```

对于动态路由，使用 `generateMetadata`：

```tsx
// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `文章：${slug}` };
}
```

> **Next.js 15 重要变更：** `params` 现在是一个 `Promise`，必须 `await`。

---

## 2.2 布局系统

`layout.tsx` 是 App Router 最强大的特性之一。它让页面之间共享 UI 变得自然，**且在路由切换时保留状态**。

### 根布局

```tsx
// src/app/layout.tsx — 必须存在，且必须包含 html 和 body 标签
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { template: '%s | My App', default: 'My App' },
  description: 'A Next.js application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <header className="border-b p-4">
          <nav>
            <a href="/" className="mr-4">首页</a>
            <a href="/about" className="mr-4">关于</a>
            <a href="/blog">博客</a>
          </nav>
        </header>
        <main className="p-4">{children}</main>
        <footer className="border-t p-4 text-center text-sm text-gray-500">
          © 2026 My App
        </footer>
      </body>
    </html>
  );
}
```

### 嵌套布局

```
app/
├── layout.tsx            # 根布局（Header + Footer）
├── page.tsx              # /
└── dashboard/
    ├── layout.tsx        # Dashboard 专属布局（侧边栏）
    ├── page.tsx          # /dashboard
    ├── settings/
    │   └── page.tsx      # /dashboard/settings
    └── analytics/
        └── page.tsx      # /dashboard/analytics
```

```tsx
// src/app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* 侧边栏在路由切换时保持不变 */}
      <aside className="w-64 border-r p-4">
        <nav className="flex flex-col gap-2">
          <a href="/dashboard">概览</a>
          <a href="/dashboard/settings">设置</a>
          <a href="/dashboard/analytics">分析</a>
        </nav>
      </aside>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
```

### layout vs template

| 特性 | `layout.tsx` | `template.tsx` |
|------|-------------|----------------|
| 路由切换时 | 保留状态、不重新挂载 | 重新挂载 |
| 适用场景 | 导航栏、侧边栏 | 页面过渡动画、重置状态 |
| 可以共存 | 是 | 是 |

```tsx
// src/app/template.tsx — 每次路由切换都会重新挂载
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
```

---

## 2.3 动态路由

### 基础动态段 `[param]`

```tsx
// src/app/blog/[slug]/page.tsx
type Props = { params: Promise<{ slug: string }> };

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  return <h1>文章：{slug}</h1>;
}
```

### Catch-all 段 `[...slug]`

匹配任意深度的路径：

```
app/docs/[...slug]/page.tsx
  → /docs                          → { slug: [] }
  → /docs/getting-started         → { slug: ['getting-started'] }
  → /docs/api/auth               → { slug: ['api', 'auth'] }
```

```tsx
// src/app/docs/[...slug]/page.tsx
type Props = { params: Promise<{ slug: string[] }> };

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  // slug = ['getting', 'started'] 对应 /docs/getting/started
  return <h1>文档：{slug.join(' / ')}</h1>;
}
```

### Optional Catch-all `[[...slug]]`

与 Catch-all 一样，但**父路由不需要单独的 page.tsx**：

```
app/shop/[[...slug]]/page.tsx
  → /shop            → { slug: undefined }  ← 也会匹配！
  → /shop/cart       → { slug: ['cart'] }
  → /shop/products/1 → { slug: ['products', '1'] }
```

### `generateStaticParams` — 静态生成动态路由

```tsx
// src/app/blog/[slug]/page.tsx
type Props = { params: Promise<{ slug: string }> };

// 在构建时生成所有静态页面
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
      <div>{post.content}</div>
    </article>
  );
}
```

---

## 2.4 路由组与私有文件夹

### 路由组 `(group)`

文件夹名用括号包裹 → **不影响 URL**，仅用于逻辑分组：

```
app/
├── (marketing)/
│   ├── page.tsx        → /
│   └── about/
│       └── page.tsx    → /about
└── (dashboard)/
    ├── layout.tsx       # 独立的 Dashboard 布局
    ├── page.tsx         → /dashboard
    └── settings/
        └── page.tsx    → /dashboard/settings
```

**用途：** 给不同路由区域设置独立的 layout，而不影响 URL 结构。

### 私有文件夹 `_folder`

以 `_` 开头的文件夹和文件**不会被注册为路由**：

```
app/
├── _components/         # 仅在此目录下使用的组件
│   ├── Button.tsx
│   └── Card.tsx
├── _lib/                # 工具函数
│   └── api.ts
└── blog/
    ├── _components/     # 博客专属组件
    │   └── PostCard.tsx
    └── page.tsx         → /blog
```

---

## 2.5 Loading UI 与 Streaming

### `loading.tsx`

当页面数据需要时间加载时，Next.js 会自动展示 `loading.tsx`：

```tsx
// src/app/blog/loading.tsx
export default function BlogLoading() {
  return (
    <div className="animate-pulse space-y-4 p-8">
      <div className="h-8 w-1/3 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-2/3 rounded bg-gray-200" />
    </div>
  );
}
```

`loading.tsx` 自动包裹 `page.tsx` 在一个 `<Suspense>` 边界中。

### 手动使用 Suspense

你也可以手动创建更精细的 Suspense 边界：

```tsx
// src/app/dashboard/page.tsx
import { Suspense } from 'react';
import { RevenueChart, RevenueChartSkeleton } from './_components/revenue';
import { LatestInvoices, LatestInvoicesSkeleton } from './_components/invoices';

export default function DashboardPage() {
  return (
    <div className="grid gap-4">
      {/* 两个数据块独立加载，互不阻塞 */}
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart />
      </Suspense>
      <Suspense fallback={<LatestInvoicesSkeleton />}>
        <LatestInvoices />
      </Suspense>
    </div>
  );
}
```

```tsx
// src/app/dashboard/_components/revenue.tsx
export async function RevenueChart() {
  // 模拟慢查询
  const data = await fetch('https://api.example.com/revenue', {
    next: { revalidate: 3600 },
  }).then(r => r.json());

  return <Chart data={data} />;
}

export function RevenueChartSkeleton() {
  return <div className="h-64 animate-pulse rounded bg-gray-100" />;
}
```

### 流式渲染 (Streaming) 原理

```
传统 SSR：
[获取数据1 (2s)] → [获取数据2 (1s)] → [渲染] → [发送完整 HTML] (总共3s)
                              ↑ 用户等待 3 秒才看到任何内容

Streaming：
[Shell HTML 立即发送] → [Suspense#1 数据就绪] → [流式发送#1] → [Suspense#2 数据就绪] → [流式发送#2]
              用户立即看到骨架屏               1s后看到内容1              2s后看到内容2
```

---

## 2.6 错误处理

### `error.tsx` — 组件级错误边界

```tsx
'use client'; // error.tsx 必须是客户端组件

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 可以将错误上报到错误监控服务
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">出了点问题</h2>
      <p className="text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        再试一次
      </button>
    </div>
  );
}
```

### `global-error.tsx` — 根布局级错误

当根布局出错时使用（必须包含 `<html>` 和 `<body>`）：

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold">500</h1>
            <p className="mt-2 text-gray-500">服务器出错了</p>
            <button onClick={reset} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### `not-found.tsx` — 404 页面

```tsx
// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-gray-500">这个页面不存在</p>
      <Link href="/" className="text-blue-500 underline">
        返回首页
      </Link>
    </div>
  );
}
```

在组件中手动触发 404：

```tsx
import { notFound } from 'next/navigation';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());

  if (!post) {
    notFound(); // 触发最近的 not-found.tsx
  }

  return <article>{post.content}</article>;
}
```

---

## 2.7 并行路由与拦截路由

### 并行路由 `@slot`

用 `@` 开头的文件夹定义**插槽 (slot)**，同一路由下多个 slot 同时渲染：

```
app/
└── dashboard/
    ├── layout.tsx       # 通过 props 接收各 slot
    ├── @analytics/
    │   └── page.tsx
    ├── @revenue/
    │   └── page.tsx
    └── page.tsx         # children slot
```

```tsx
// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,   // page.tsx
  analytics,  // @analytics/page.tsx
  revenue,    // @revenue/page.tsx
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  revenue: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">{children}</div>
      <div>{analytics}</div>
      <div>{revenue}</div>
    </div>
  );
}
```

**适用场景：** 仪表盘、复杂布局，每个区域独立加载、独立 Suspense。

### 拦截路由 `(.)folder`

拦截路由让你在当前页面"拦截"一个链接的跳转，以模态框等形式展示内容：

```
app/
├── feed/
│   └── page.tsx             # /feed — 信息流列表
├── photo/
│   └── [id]/
│       └── page.tsx         # /photo/1 — 独立的照片详情页
└── (.)photo/                # 拦截路由（不会出现在URL中）
    └── [id]/
        └── page.tsx         # 从 /feed 点击照片时，以模态框展示
```

约定前缀：

| 前缀 | 匹配范围 | 示例 |
|------|---------|------|
| `(.)` | 同级目录 | `(.)photo` — 拦截同级 `photo` 路由 |
| `(..)` | 上一级目录 | `(..)photo` |
| `(..)(..)` | 上两级 | `(..)(..)photo` |
| `(...)` | 从 app 根 | `(...)photo/[id]` |

```tsx
// src/app/(.)photo/[id]/page.tsx
import { Modal } from '@/components/modal';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function PhotoModal({ params }: Props) {
  const { id } = await params;
  const photo = await fetch(`https://api.example.com/photos/${id}`).then(r => r.json());
  if (!photo) notFound();

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} className="max-h-[80vh]" />
      <h2>{photo.title}</h2>
    </Modal>
  );
}
```

> **原理：** 拦截路由本质上是 Next.js 在客户端路由导航时的特殊处理——当目标路由存在拦截版本时，优先渲染拦截视图。

---

## 2.8 路由处理器 (Route Handlers)

`route.ts` 提供标准的 Web API 请求处理：

```ts
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page') || '1';

  const posts = await db.post.findMany({
    take: 10,
    skip: (Number(page) - 1) * 10,
  });

  return NextResponse.json({ posts, page: Number(page) });
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 数据校验
  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: 'title 和 content 不能为空' },
      { status: 400 },
    );
  }

  const post = await db.post.create({ data: body });

  return NextResponse.json(post, { status: 201 });
}
```

动态 API 路由：

```ts
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  const post = await db.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**注意：** `route.ts` 不能与 `page.tsx` 在同一目录共存。

---

## 本章关键 API 速查

| API | 作用 |
|-----|------|
| `page.tsx` | 定义路由页面 |
| `layout.tsx` | 持久布局 |
| `template.tsx` | 每次挂载的布局 |
| `loading.tsx` | 加载状态 |
| `error.tsx` | 错误边界 |
| `not-found.tsx` | 404 页面 |
| `global-error.tsx` | 根布局错误 |
| `route.ts` | API 路由处理器 |
| `notFound()` | 手动触发 404 |
| `redirect()` | 服务端重定向 |
| `generateStaticParams` | 静态生成动态路由 |
| `generateMetadata` | 动态元数据 |

---

:::demo route-params
:::

## 练习

1. 创建一个博客路由结构：`/blog`(列表)、`/blog/[slug]`(详情)，实现 layout 包裹导航
2. 为博客添加 `loading.tsx` 和 `error.tsx`
3. 用 `generateStaticParams` 预生成 3 篇文章的静态页面
4. 创建一个 `/api/hello` 的 GET 接口，返回 `{ message: "Hello" }`
5. 实现一个拦截路由：从列表页点击条目，以模态框展示详情
